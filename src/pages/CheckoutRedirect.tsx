import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CheckoutRedirect() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        toast.error("Missing session ID.");
        setStatus('error');
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
        return;
      }

      try {
        const response = await fetch(
          'https://fweatrkxjdlwyjrofsgv.supabase.co/functions/v1/verify-checkout-session',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ session_id: sessionId }),
          }
        );

        const data = await response.json();

        if (data.success) {
          console.log('Payment verification response:', data);
          
          if (data.premium_status) {
            toast.success('Payment successful! Your subscription is now active.');
            setStatus('success');

            // Get stored return URL or default to dashboard
            const returnUrl = localStorage.getItem('checkoutReturnUrl') || '/dashboard';
            localStorage.removeItem('checkoutReturnUrl'); // Clean up

            // Short delay before redirect
            setTimeout(() => {
              // Force refresh subscription status before redirect
              window.location.href = returnUrl;
            }, 2000);
          } else {
            console.error('Payment verified but premium status not updated');
            toast.error('Payment verified but subscription activation failed. Please contact support.');
            setStatus('error');
            setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
          }
        } else {
          throw new Error(data.message || 'Payment verification failed.');
        }
      } catch (error) {
        console.error("Verification error:", error);
        toast.error("There was a problem verifying your payment.");
        setStatus('error');
        setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
      }
    };

    verifyPayment();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Verifying Payment
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Payment Verified
              </>
            )}
            {status === 'error' && (
              <>
                <AlertTriangle className="h-6 w-6 text-red-500" />
                Verification Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your payment...'}
            {status === 'success' && 'Your subscription has been activated. Redirecting...'}
            {status === 'error' && 'We couldn\'t verify your payment. Redirecting...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 