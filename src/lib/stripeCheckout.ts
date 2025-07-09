export async function createCheckoutSession({
  userId,
  priceId,
  planId,
  assessmentId,
}: {
  userId: string;
  priceId: string;
  planId: string;
  assessmentId?: string;
}) {
  try {
  const res = await fetch('https://fweatrkxjdlwyjrofsgv.supabase.co/functions/v1/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      price_id: priceId,
      plan_id: planId,
      assessment_id: assessmentId,
    }),
  });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to create checkout session');
    }

  const { url } = await res.json();
    if (!url) {
      throw new Error('No checkout URL received');
    }

    // Store return URL in localStorage before redirect
    const returnUrl = localStorage.getItem('subscriptionReturnUrl');
    if (returnUrl) {
      localStorage.setItem('checkoutReturnUrl', returnUrl);
    }

    // Redirect to Stripe Checkout
  window.location.href = url;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
} 