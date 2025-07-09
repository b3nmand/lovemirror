import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Initialize Stripe with secret key
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(stripeSecretKey);

// Get webhook secret for signature verification
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_jMRmlYOvLt7ilJFz5A6RFbjkr7vxP4MT';
if (!endpointSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

// Set up CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature'
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
    }
  return new Response('OK', { status: 200, headers: corsHeaders });
}); 