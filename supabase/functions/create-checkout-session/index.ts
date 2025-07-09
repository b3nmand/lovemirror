import Stripe from "npm:stripe@12.14.0";

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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16'
});

Deno.serve(async (req) => {
  // Handle CORS preflight first
  if (req.method === "OPTIONS") {
    console.log("OPTIONS preflight");
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "POST") {
    console.log("Function invoked");
    try {
      const { user_id, price_id, plan_id, assessment_id } = await req.json();
      console.log("Received body:", { user_id, price_id, plan_id, assessment_id });

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price: price_id,
            quantity: 1
          }
        ],
        success_url: 'https://lovemirror.co.uk/checkout-redirect?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://lovemirror.co.uk/cancel',
        metadata: { user_id, plan_id, assessment_id }
      });

      console.log("Session created:", session.url);
      return successResponse({ url: session.url });
    } catch (error) {
      console.error("Error in function:", error);
      return errorResponse("Failed to create checkout session", 500, error);
    }
  }

  return errorResponse("Method not allowed", 405);
});