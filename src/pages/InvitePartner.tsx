import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Send, Loader2, CheckCircle, XCircle, Mail, Calendar, ArrowUpRight, Info, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  createPartnerInvitation, 
  getActiveInvitation, 
  getUserRelationships,
  type PartnerInvitation,
  type Relationship 
} from '@/lib/compatibility';
import { sendInvitationEmail } from '@/lib/email';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function InvitePartner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeInvitation, setActiveInvitation] = useState<PartnerInvitation | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [hasPartner, setHasPartner] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        // Get current user
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        console.log('Fetched user:', user, 'Error:', getUserError);
        if (getUserError || !user) {
          navigate('/auth');
          return;
        }
        setUser(user);
        
        // Check for existing relationships
        const { data: relationshipsData, error: relationshipsError } = await getUserRelationships();
        console.log('Fetched relationships:', relationshipsData, 'Error:', relationshipsError);
        if (!relationshipsError) {
          setRelationships(relationshipsData || []);
          setHasPartner(relationshipsData && relationshipsData.length > 0);
          
          // If user already has a partner, no need to check for invitations
          if (relationshipsData && relationshipsData.length > 0) {
            setLoading(false);
            return;
          }
        }
        
        // Check for existing active invitation
        const { data: invitation, error } = await getActiveInvitation();
        console.log('Fetched active invitation:', invitation, 'Error:', error);
        if (error) {
          console.error('Error fetching invitation:', error);
          setErrorMessage('Failed to load existing invitations');
        } else {
          setActiveInvitation(invitation);
        }
      } catch (error) {
        console.error('Error loading invitation data:', error);
        setErrorMessage('Failed to load invitation data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [navigate]);

  const handleCreateInvitation = async () => {
    try {
      setInvitationLoading(true);
      setErrorMessage(null);
      
      // Validate email if provided
      if (partnerEmail && !/^\S+@\S+\.\S+$/.test(partnerEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      const { data, error } = await createPartnerInvitation(partnerEmail || null);
      console.log('Created invitation:', data, 'Error:', error);
      if (error) {
        console.error('Error creating invitation:', error);
        setErrorMessage('Failed to create invitation. Please try again.');
        toast.error('Failed to create invitation');
        return;
      }
      
      if (!data) {
        setErrorMessage('No invitation data returned. Please try again.');
        toast.error('Failed to create invitation');
        return;
      }
      
      setActiveInvitation(data);
      toast.success('Invitation created successfully');
      
      // Send email if email address was provided
      if (partnerEmail && data) {
        try {
          // Get user profile for sender name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();
            
          const senderName = profile?.name || 'Your partner';
          
          setSendingEmail(true);
          const { success, error } = await sendInvitationEmail(
            data.invitation_code,
            partnerEmail,
            'partner',
            senderName
          );
          console.log('Email send result:', { success, error });
          
          if (!success) {
            console.warn('Email sending failed:', error);
            toast.warning('Invitation created, but email could not be sent. You can copy the link and share it directly.');
          } else {
            toast.success('Invitation email sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          toast.warning('Invitation created, but email could not be sent. You can copy the link and share it directly.');
        } finally {
          setSendingEmail(false);
        }
      }
      
      setPartnerEmail('');
    } catch (err: any) {
      console.error('Error creating invitation:', err);
      setErrorMessage(err.message || 'Failed to create invitation. Please try again.');
      toast.error('Failed to create invitation');
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleCopyInvitationLink = () => {
    if (!activeInvitation) return;
    
    const invitationLink = `${window.location.origin}/invitation/${activeInvitation.invitation_code}`;
    navigator.clipboard.writeText(invitationLink);
    setCopySuccess(true);
    toast.success('Invitation link copied to clipboard');
    
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleSendInvitationEmail = async () => {
    if (!activeInvitation || !activeInvitation.email) return;
    
    try {
      setSendingEmail(true);
      
      // Get user profile for sender name
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
        
      const senderName = profile?.name || 'Someone you know';
      
      // Send the invitation email
      const { success, error } = await sendInvitationEmail(
        activeInvitation.invitation_code,
        activeInvitation.email,
        'partner',
        senderName
      );
      console.log('Email send result:', { success, error });
      
      if (!success) {
        throw error || new Error('Failed to send email');
      }
      
      toast.success(`Invitation email sent to ${activeInvitation.email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send invitation email. You can copy and share the link directly.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleViewRelationship = (relationshipId: string) => {
    navigate(`/compatibility/${relationshipId}`);
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-4 sm:p-6 flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading invitation data...</p>
        </div>
      </div>
    );
  }

  console.log('Render state:', { hasPartner, activeInvitation, relationships, loading, errorMessage, partnerEmail });

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ 
        background: 'linear-gradient(90deg, #ff0099, #9900ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {hasPartner ? 'Partner Connection' : 'Ready to see how aligned you really are?'}
      </h1>
      
      {!hasPartner && (
        <p className="text-base sm:text-lg mb-6 text-muted-foreground">
          Invite your partner to take the same relationship assessment. Once complete, 
          you'll unlock your Compatibility Score and discover how your values, habits, 
          and mindsets align.
        </p>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {hasPartner ? (
        <div className="grid gap-6">
          {Array.isArray(relationships) && relationships.map((relationship) => (
            <Card key={relationship.id} className="bg-gradient-to-br from-white to-pink-50/30 shadow-md border-pink-100">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Connected with {relationship.partner_name}</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Active Partnership
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Manage your relationship connection and view compatibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://avatars.dicebear.com/api/initials/${relationship.partner_name}.svg`} />
                    <AvatarFallback>
                      {relationship.partner_name?.substring(0, 2).toUpperCase() || 'PA'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{relationship.partner_name}</h3>
                    <p className="text-sm text-muted-foreground">{relationship.partner_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Connected since {new Date(relationship.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-100">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Partnership Active</AlertTitle>
                  <AlertDescription>
                    You and {relationship.partner_name} are connected. Complete your assessments to view your compatibility score.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  onClick={() => handleViewRelationship(relationship.id)}
                >
                  View Compatibility
                </Button>
                <Button
                  className="w-full mt-2 bg-red-100 text-red-700 hover:bg-red-200"
                  variant="outline"
                  onClick={async () => {
                    await supabase
                      .from('relationships')
                      .update({ status: 'inactive' })
                      .eq('id', relationship.id);
                    // Refresh relationships
                    const { data: relationshipsData } = await getUserRelationships();
                    setRelationships(relationshipsData || []);
                    setHasPartner(relationshipsData && relationshipsData.length > 0);
                  }}
                >
                  Disconnect Partner
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-white to-pink-50/30 shadow-md border-pink-100">
            <CardHeader>
              <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">Send Invitation</CardTitle>
              <CardDescription>
                Choose how you want to invite your partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeInvitation ? (
                <div>
                  <Label className="text-base font-medium flex items-center">
                    <span className="mr-2">Best Practice: Copy Link Manually</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Recommended</Badge>
                  </Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex">
                      <Input
                        readOnly
                        value={`${window.location.origin}/invitation/${activeInvitation.invitation_code}`}
                        className="rounded-r-none text-muted-foreground"
                      />
                      <Button
                        onClick={handleCopyInvitationLink}
                        className={`rounded-l-none transition-all duration-200 ${copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'}`}
                      >
                        {copySuccess ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Send this to your partner however you like (text, WhatsApp, DM, etc.)
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="email" className="text-base font-medium">Create New Invitation</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex">
                      <Input
                        id="email"
                        type="email"
                        placeholder="partner@example.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button
                        onClick={handleCreateInvitation}
                        className="rounded-l-none bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        disabled={invitationLoading}
                      >
                        {invitationLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>Create</>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Optional: add your partner's email to send an invitation email
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              {!activeInvitation ? (
                <Button
                  onClick={handleCreateInvitation}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  disabled={invitationLoading}
                >
                  {invitationLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Invitation...
                    </>
                  ) : (
                    'Create Invitation Without Email'
                  )}
                </Button>
              ) : activeInvitation.email ? (
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={handleSendInvitationEmail}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Email Invitation
                    </>
                  )}
                </Button>
              ) : (
                <div>
                  <Label htmlFor="addEmail" className="text-base font-medium">Add Email Later</Label>
                  <div className="mt-2 flex">
                     <Input
                      id="addEmail"
                      type="email"
                      placeholder="partner@example.com"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="rounded-r-none"
                    />
                    <Button
                      onClick={handleCreateInvitation}
                      className="rounded-l-none bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      disabled={invitationLoading || !partnerEmail}
                    >
                      {invitationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Send Email</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {activeInvitation && (
            <Card className="bg-gradient-to-br from-white to-blue-50/30 shadow-md border-blue-100">
              <CardHeader>
                <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Invitation Status</CardTitle>
                <CardDescription>
                  Track the status of your partner invitation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className={activeInvitation.status === 'pending' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}>
                  {activeInvitation.status === 'pending' ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                        <AlertTitle>Invitation Active</AlertTitle>
                      </div>
                      <AlertDescription>
                        Your invitation is active and waiting for your partner to accept.
                      </AlertDescription>
                    </div>
                  ) : activeInvitation.status === 'accepted' ? (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <AlertTitle>Invitation Accepted</AlertTitle>
                      </div>
                      <AlertDescription>
                        Your partner has accepted the invitation. You are now connected!
                      </AlertDescription>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 text-gray-500 mr-2" />
                        <AlertTitle className="capitalize">{activeInvitation.status}</AlertTitle>
                      </div>
                      <AlertDescription>
                        This invitation is no longer active.
                      </AlertDescription>
                    </div>
                  )}
                </Alert>

                {activeInvitation.status === 'pending' && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Invite link:</span>
                        <TooltipWrapper content="Click to copy">
                          <Button 
                            variant="ghost" 
                            className="h-6 p-0 hover:bg-transparent"
                            onClick={handleCopyInvitationLink}
                          >
                            <span className="font-mono text-xs truncate max-w-[150px]">
                              {activeInvitation.invitation_code}
                            </span>
                            {copySuccess ? (
                              <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                        </TooltipWrapper>
                      </div>
                      {activeInvitation.email && (
                        <div className="flex justify-between text-sm">
                          <span>Sent to:</span>
                          <span className="font-medium">{activeInvitation.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium">Waiting for partner to complete</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Valid until:</span>
                        <span className="font-medium flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(activeInvitation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full w-[25%]"></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Invited</span>
                      <span>Accepted</span>
                      <span>Completed</span>
                      <span>Analyzed</span>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full">
                  {(activeInvitation.status !== 'pending' || new Date(activeInvitation.expires_at) < new Date()) && (
                    <Button
                      onClick={handleCreateInvitation}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Create New Invitation
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      )}

      <div className="mt-8">
        <Card className="bg-gradient-to-br from-white to-purple-50/30 shadow-md border-purple-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:space-x-4">
              <div className="mb-4 sm:mb-0 sm:mt-1 flex-shrink-0">
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-2 rounded-full">
                  <Info className="h-6 w-6 text-pink-500" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600">How to invite your partner</h3>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Best Method:</strong> Copy the invitation link and send it directly to your partner via text, WhatsApp, etc.</li>
                  <li>The link contains a unique code tied to your account</li>
                  <li>Your partner will need to create an account or sign in to accept</li>
                  <li>After acceptance, you'll both see your compatibility results</li>
                </ul>
                <div className="mt-4">
                  <a 
                    href="https://www.amazon.co.uk/dp/B0BM8H9D12" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors"
                  >
                    Learn about The Cog Effect
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}