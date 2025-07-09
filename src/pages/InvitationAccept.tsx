import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getInvitationByCode, acceptInvitation, declineInvitation } from '@/lib/compatibility';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function InvitationAccept() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [senderProfile, setSenderProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [relationshipId, setRelationshipId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvitation() {
      try {
        setLoading(true);
        
        if (!code) {
          setError('Invalid invitation code');
          return;
        }
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        // Get invitation
        const { data: invitation, error: invitationError } = await getInvitationByCode(code);
        
        if (invitationError || !invitation) {
          setError('Invalid or expired invitation code');
          return;
        }
        
        // Verify that the invitation is not for the same user
        if (user && invitation.sender_id === user.id) {
          setError('You cannot accept your own invitation');
          return;
        }
        
        setInvitation(invitation);
        
        // Get sender profile
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', invitation.sender_id)
          .single();
          
        setSenderProfile(senderProfile);
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvitation();
  }, [code, navigate]);

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;
    
    try {
      setProcessing(true);
      
      const { success, error, relationshipId: newRelationshipId } = await acceptInvitation(invitation.id);
      
      if (!success) {
        throw error;
      }
      
      setAccepted(true);
      setRelationshipId(newRelationshipId || null);
      toast.success('Invitation accepted successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;
    
    try {
      setProcessing(true);
      
      const { success, error } = await declineInvitation(invitation.id);
      
      if (!success) {
        throw error;
      }
      
      setDeclined(true);
      toast.success('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTitle>Invalid Invitation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => navigate('/')}
            >
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {senderProfile?.name || 'Someone'} has invited you to connect on Love Mirror.
              Please sign in or create an account to continue.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              onClick={() => {
                // Store invitation code in localStorage before redirecting
                if (code) {
                  localStorage.setItem('pendingInvitationCode', code);
                }
                navigate('/auth');
              }}
            >
              Sign In or Register
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center mb-6">
                You have successfully connected with {senderProfile?.name || 'your partner'}.
                You can now view your compatibility assessment.
              </p>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => relationshipId ? navigate(`/compatibility/${relationshipId}`) : navigate('/dashboard')}
              >
                {relationshipId ? 'View Compatibility' : 'View Dashboard'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Invitation Declined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center mb-6">
                You have declined the invitation from {senderProfile?.name || 'your partner'}.
              </p>
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Partner Invitation</CardTitle>
          <CardDescription>
            You've been invited to connect for a compatibility assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTitle>Invitation from {senderProfile?.name || 'Someone Special'}</AlertTitle>
            <AlertDescription>
              {senderProfile?.name || 'Your partner'} has invited you to connect on Love Mirror to
              assess your relationship compatibility.
            </AlertDescription>
          </Alert>
          
          <p className="mb-6">
            By accepting this invitation, you'll be connected with {senderProfile?.name || 'your partner'} on 
            Love Mirror. This will allow you to:
          </p>
          
          <ul className="list-disc pl-6 mb-6 space-y-1">
            <li>Share your assessment results with each other</li>
            <li>View your relationship compatibility score</li>
            <li>Get personalized insights for your relationship</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            onClick={handleAcceptInvitation}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDeclineInvitation}
            disabled={processing}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}