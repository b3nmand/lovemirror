import Stripe from "npm:stripe@12.14.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

// CORS utilities (inline to avoid import issues)
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://lovemirror.co.uk',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, apikey',
};

const jsonResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

const errorResponse = (message: string, status: number = 500, error?: any) => {
  return jsonResponse({
    success: false,
    message,
    ...(error && { error: error.message }),
  }, status);
};

const successResponse = (data: any = {}) => {
  return jsonResponse({
    success: true,
    ...data,
  });
};

// Load environment variables
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("Environment check:", {
  hasStripeKey: !!STRIPE_SECRET_KEY,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
});

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing one or more required environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // 🚨 CRITICAL: Handle CORS preflight FIRST, before any other logic
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Wrap everything in try-catch to catch ANY error
  try {
    console.log("Function invoked with method:", req.method);
    console.log("Request URL:", req.url);
    
    // Only handle POST requests
    if (req.method !== "POST") {
      console.error("Invalid method:", req.method);
      return errorResponse("Method not allowed", 405);
    }

    console.log("Starting payment verification...");
    
    // Safely parse JSON with error handling
    let body;
    try {
      body = await req.json();
      console.log("Request body received:", body);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      return errorResponse("Invalid JSON in request body", 400, jsonError);
    }
    
    const { session_id } = body;
    if (!session_id) {
      console.error("No session_id provided in request body");
      return errorResponse("No session_id provided", 400);
    }

    console.log("Retrieving Stripe session:", session_id);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Stripe session retrieved successfully:", {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata,
      customer: session.customer,
      amount_total: session.amount_total,
    });

    if (session.payment_status !== "paid") {
      console.error("Payment not completed:", session.payment_status);
      return errorResponse("Payment not completed", 400, { status: session.payment_status });
    }

    const user_id = session.metadata?.user_id;
    const plan_id = session.metadata?.plan_id;
    const assessment_id = session.metadata?.assessment_id;

    console.log("Extracted metadata:", { user_id, plan_id, assessment_id });

    if (!user_id || !plan_id) {
      console.error("Missing required metadata:", { user_id, plan_id });
      return errorResponse("Missing required session metadata", 400, { metadata: session.metadata });
    }

    console.log("Updating user profile for user:", user_id);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        last_plan_id: plan_id,
        last_assessment_id: assessment_id || null,
      })
      .eq("id", user_id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return errorResponse("Failed to update user profile", 500, profileError);
    }

    console.log("Profile updated successfully");

    // Subscription logic
    console.log("Creating subscription record for plan:", plan_id);
    const periodStart = new Date().toISOString();
    let periodEnd: string;
    if (plan_id === "price_lifetime" || plan_id === "lifetime") {
      periodEnd = new Date(new Date().setFullYear(new Date().getFullYear() + 100)).toISOString();
    } else {
      periodEnd = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString();
    }

    console.log("Subscription period:", { periodStart, periodEnd });

    const { error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id,
        status: "active",
        plan: plan_id,
        plan_id: plan_id,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        created_at: periodStart,
        updated_at: periodStart,
      });

    if (subError) {
      console.error("Subscription insert error:", subError);
      // Don't fail the entire request if subscription insert fails
      console.warn("Continuing despite subscription insert failure");
    } else {
      console.log("Subscription created successfully");
    }

    console.log("Payment verification completed successfully for user:", user_id);
    return successResponse({
      plan_id,
      assessment_id,
      user_id,
      ...(subError && { warning: "Subscription insert failed", subError }),
    });

  } catch (error) {
    // 🚨 CRITICAL: Catch ANY unhandled error and log it
    console.error("Fatal error in verify-checkout-session:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    
    return errorResponse("Internal server error", 500, error);
  }
});
