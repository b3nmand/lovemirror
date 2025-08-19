import Stripe from 'npm:stripe@14.14.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Initialize Stripe with secret key
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(stripeSecretKey);

// Get webhook secret for signature verification
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
if (!endpointSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing signature', { status: 400, headers: corsHeaders });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400, headers: corsHeaders });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 500, headers: corsHeaders });
  }
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const { data: customer } = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) return;
    
    const customerEmail = (customer as Stripe.Customer).email;
    if (!customerEmail) return;

    // Find user by email
    const { data: user } = await supabase.auth.admin.listUsers();
    const userRecord = user.users.find(u => u.email === customerEmail);
    
    if (!userRecord) {
      console.error('User not found for customer:', customerId);
      return;
    }

    // Create or update subscription record
    const subscriptionData = {
      user_id: userRecord.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      plan_id: subscription.items.data[0]?.price.id,
      plan: subscription.items.data[0]?.price.nickname || 'Premium Plan',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSub.id);
    } else {
      // Create new subscription
      await supabase
        .from('subscriptions')
        .insert(subscriptionData);
    }

    // Update user's premium status
    await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        last_plan_id: subscription.items.data[0]?.price.id
      })
      .eq('id', userRecord.id);

    console.log(`Subscription created for user: ${userRecord.id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!existingSub) return;

    // Update subscription record
    const updateData = {
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    };

    await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', existingSub.id);

    // Update user's premium status based on subscription status
    const isPremium = ['active', 'trialing'].includes(subscription.status);
    await supabase
      .from('profiles')
      .update({ is_premium: isPremium })
      .eq('id', existingSub.user_id);

    console.log(`Subscription updated for user: ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!existingSub) return;

    // Update subscription status to canceled
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    // Remove user's premium status
    await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', existingSub.user_id);

    console.log(`Subscription canceled for user: ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!existingSub) return;

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    console.log(`Trial ending for user: ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling trial will end:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .maybeSingle();

    if (!existingSub) return;

    // Update subscription status to active
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    // Ensure user has premium status
    await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', existingSub.user_id);

    console.log(`Payment succeeded for user: ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .maybeSingle();

    if (!existingSub) return;

    // Update subscription status to past_due
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSub.id);

    // Remove user's premium status
    await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', existingSub.user_id);

    console.log(`Payment failed for user: ${existingSub.user_id}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
} 