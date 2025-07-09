/**
 * Edge Function – calculates and stores a compatibility score
 * -----------------------------------------------------------
 * – Validates the caller's JWT and makes sure they belong to the relationship
 * – Accepts either { invitation_code } or { relationship_id } in the POST body
 * – Finds the latest completed assessment for each partner
 * – Normalises category names → lowercase
 * – Calculates per-category and overall compatibility
 * – Upserts a row in `compatibility_scores`
 * – Returns { success, compatibilityScore }
 */
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

/* -------------------------------------------------------------------------- */
/*  CORS                                                                      */
/* -------------------------------------------------------------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://lovemirror.co.uk",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,apikey,authorization",
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const success = (data: unknown) => jsonResponse({ success: true, ...data });
const failure = (message: string, status = 500, error?: unknown) =>
  jsonResponse(
    { success: false, message, ...(error && { error }) },
    status,
  );

/* -------------------------------------------------------------------------- */
/*  Environment                                                               */
/* -------------------------------------------------------------------------- */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
type CategoryScore = { category: string; percentage: number };

const normalise = (cat: string) => cat.trim().toLowerCase();

/* -------------------------------------------------------------------------- */
/*  Handler                                                                   */
/* -------------------------------------------------------------------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://lovemirror.co.uk",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey, authorization"
      }
    });
  }
  if (req.method !== "POST") {
    return failure("Method not allowed", 405);
  }

  try {
    /* -------------------------------------------------------------------- */
    /*  1.  Parse body + verify JWT                                         */
    /* -------------------------------------------------------------------- */
    const body = await req.json();
    const { invitation_code, relationship_id } = body as
      | { invitation_code?: string; relationship_id?: string }
      | undefined;

    const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!jwt) return failure("Unauthenticated", 401);

    const {
      data: { user },
      error: jwtError,
    } = await supabase.auth.getUser(jwt);
    if (jwtError || !user) return failure("Unauthenticated", 401, jwtError);
    const callerId = user.id;

    /* -------------------------------------------------------------------- */
    /*  2.  Resolve relationship                                            */
    /* -------------------------------------------------------------------- */
    let relId: string;
    let user1_id: string;
    let user2_id: string;

    if (invitation_code) {
      /* — a. via invitation ------------------------------------------------ */
      const { data: invitation, error: invErr } = await supabase
        .from("partner_invitations")
        .select("id,sender_id,status")
        .eq("invitation_code", invitation_code)
        .single();

      if (invErr || !invitation) {
        return failure("Invalid invitation code", 400, invErr);
      }

      const { data: relationship, error: relErr } = await supabase
        .from("relationships")
        .select("id,user1_id,user2_id")
        .or(
          `user1_id.eq."${invitation.sender_id}",user2_id.eq."${invitation.sender_id}"`,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (relErr || !relationship) {
        return failure("No relationship found for invitation", 404, relErr);
      }
      ({ id: relId, user1_id, user2_id } = relationship);
    } else if (relationship_id) {
      /* — b. via explicit id ---------------------------------------------- */
      const { data: relationship, error: relErr } = await supabase
        .from("relationships")
        .select("id,user1_id,user2_id")
        .eq("id", relationship_id)
        .single();

      if (relErr || !relationship) {
        return failure("Invalid relationship_id", 400, relErr);
      }
      ({ id: relId, user1_id, user2_id } = relationship);
    } else {
      return failure("Must provide invitation_code or relationship_id", 400);
    }

    /* — AuthZ: ensure the caller belongs to this relationship ------------- */
    if (![user1_id, user2_id].includes(callerId)) {
      return failure("Forbidden – you are not part of this relationship", 403);
    }

    /* -------------------------------------------------------------------- */
    /*  3.  Fetch latest completed assessments for both users               */
    /* -------------------------------------------------------------------- */
    const getLatestAssessment = (uid: string) =>
      supabase
        .from("assessment_history")
        .select("*")
        .eq("user_id", uid)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const [
      { data: a1, error: e1 },
      { data: a2, error: e2 },
    ] = await Promise.all([getLatestAssessment(user1_id), getLatestAssessment(user2_id)]);

    if (e1 || e2) return failure("Error fetching assessments", 500, e1 || e2);
    if (!a1 || !a2) {
      return failure("Both users must have completed assessments", 400);
    }

    const user1Categories = a1.category_scores as CategoryScore[];
    const user2Categories = a2.category_scores as CategoryScore[];

    /* -------------------------------------------------------------------- */
    /*  4.  Validate + normalise categories                                 */
    /* -------------------------------------------------------------------- */
    const validate = (c: CategoryScore) =>
      c &&
      typeof c.category === "string" &&
      Number.isFinite(c.percentage) &&
      c.percentage >= 0 &&
      c.percentage <= 100;

    const u1 = user1Categories.filter(validate).map((c) => ({
      ...c,
      category: normalise(c.category),
    }));
    const u2 = user2Categories.filter(validate).map((c) => ({
      ...c,
      category: normalise(c.category),
    }));

    if (!u1.length || !u2.length) {
      return failure("Invalid or empty category scores", 400);
    }

    /* -------------------------------------------------------------------- */
    /*  5.  Compute compatibility                                           */
    /* -------------------------------------------------------------------- */
    const categories = Array.from(
      new Set([...u1.map((c) => c.category), ...u2.map((c) => c.category)]),
    );

    const perCategory = categories.flatMap((cat) => {
      const c1 = u1.find((c) => c.category === cat);
      const c2 = u2.find((c) => c.category === cat);
      if (!c1 || !c2) return [];
      const diff = Math.abs(c1.percentage - c2.percentage);
      const score = Math.max(0, 100 - diff);
      return [
        {
          category: cat,
          user1_score: c1.percentage,
          user2_score: c2.percentage,
          compatibility_score: score,
          compatibility_percentage: score,
          match_percentage: score,
        },
      ];
    });

    if (!perCategory.length) {
      return failure("No matching categories found", 400);
    }

    const overall = perCategory.reduce((s, c) => s + c.compatibility_percentage, 0) /
      perCategory.length;

    /* -------------------------------------------------------------------- */
    /*  6.  Basic recommendations                                           */
    /* -------------------------------------------------------------------- */
    const recommendations = perCategory
      .filter((c) => c.compatibility_percentage < 70)
      .map((c) => ({
        category: c.category,
        suggestion:
          `Your views differ the most in ${c.category}. Try the guided exercise in that module together.`,
      }));

    /* -------------------------------------------------------------------- */
    /*  7.  Upsert into compatibility_scores                                */
    /* -------------------------------------------------------------------- */
    const { data: compatibilityScore, error: insErr } = await supabase
      .from("compatibility_scores")
      .upsert(
        {
          relationship_id: relId,
          category_scores: perCategory,
          overall_score: overall,
          overall_percentage: overall,
          recommendations,
          analysis_date: new Date().toISOString(),
        },
        { onConflict: "relationship_id" },
      )
      .select()
      .single();

    if (insErr) return failure("Error saving compatibility score", 500, insErr);

    return success({ compatibilityScore });
  } catch (err) {
    console.error("[create-compatibility-score] Fatal:", err);
    return failure("Internal server error", 500, err);
  }
}); 