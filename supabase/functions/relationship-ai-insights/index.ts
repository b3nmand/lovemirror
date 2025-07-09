// Deno Edge Function for AI-powered relationship insights
// Uses fetch to call OpenAI API (no npm package)

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
    ...(error && { error: error.message || error }),
  }, status);
};

const successResponse = (data: any = {}) => {
  return jsonResponse({
    success: true,
    ...data,
  });
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

console.log("Environment check:", {
  hasOpenAIKey: !!OPENAI_API_KEY,
});

if (!OPENAI_API_KEY) {
  throw new Error("Missing required environment variable: OPENAI_API_KEY");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://lovemirror.co.uk",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, apikey"
      }
    });
  }

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return errorResponse("Invalid JSON in request body", 400, jsonError);
    }

    const { categories } = body;
    if (!categories) {
      return errorResponse("Missing categories", 400);
    }

    const scoresText = categories.map((c: any) => `${c.name}: ${c.score}%`).join('\n');
    const prompt = `
You are a relationship coach AI. Given the following relationship assessment category scores, provide:

1. The top 2 strongest points, each with a short, positive compliment.
2. The 2 weakest points, each with a gentle, constructive suggestion.
3. A 3-step improvement plan tailored to the couple's lowest scoring areas.

Scores:
${scoresText}

Format your response as:
Strongest Points:
1. [Category]: [Compliment]
2. [Category]: [Compliment]

Weakest Points:
1. [Category]: [Suggestion]
2. [Category]: [Suggestion]

Improvement Plan:
1. [Step 1]
2. [Step 2]
3. [Step 3]
`;

    // Use fetch to call OpenAI API
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const completion = await openaiRes.json();
    const aiText = completion.choices?.[0]?.message?.content || "";

    // Simple parsing
    const strongest: { category: string, text: string }[] = [];
    const weakest: { category: string, text: string }[] = [];
    const improvementPlan: string[] = [];

    const lines = aiText.split('\n').map(l => l.trim());
    let section: "strongest" | "weakest" | "plan" | null = null;
    for (const line of lines) {
      if (/^Strongest Points:/i.test(line)) section = "strongest";
      else if (/^Weakest Points:/i.test(line)) section = "weakest";
      else if (/^Improvement Plan:/i.test(line)) section = "plan";
      else if (/^\d+\.\s*(.+?):\s*(.+)/.test(line) && section === "strongest") {
        const [, category, text] = line.match(/^\d+\.\s*(.+?):\s*(.+)/)!;
        strongest.push({ category, text });
      } else if (/^\d+\.\s*(.+?):\s*(.+)/.test(line) && section === "weakest") {
        const [, category, text] = line.match(/^\d+\.\s*(.+?):\s*(.+)/)!;
        weakest.push({ category, text });
      } else if (/^\d+\.\s*(.+)/.test(line) && section === "plan") {
        const [, step] = line.match(/^\d+\.\s*(.+)/)!;
        improvementPlan.push(step);
      }
    }

    return successResponse({ strongest, weakest, improvementPlan });
  } catch (error) {
    console.error("Fatal error in relationship-ai-insights:", error);
    return errorResponse("Internal server error", 500, error);
  }
}); 