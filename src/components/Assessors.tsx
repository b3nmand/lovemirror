import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Send, Trash2, AlertCircle, CheckCircle, ArrowUpRight, Info, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getExternalAssessors,
  resendInvitation,
  removeExternalAssessor,
  getAssessmentTypeName,
  type ExternalAssessor
} from '@/lib/assessors';
import { sendInvitationEmail } from '@/lib/email';
import { InviteAssessor } from '@/components/InviteAssessor';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { TooltipWrapper } from '@/components/TooltipWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function Assessors() {
  const navigate = useNavigate();
  const [assessors, setAssessors] = useState<ExternalAssessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessorToDelete, setAssessorToDelete] = useState<ExternalAssessor | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState<{[key: string]: boolean}>({});
  const [sendingEmails, setSendingEmails] = useState<{[key: string]: boolean}>({});
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [latestAssessor, setLatestAssessor] = useState<ExternalAssessor | null>(null);
  const inviteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAssessors();
  }, []);

  const fetchAssessors = async () => {
    setLoading(true);
    try {
      const { data, error } = await getExternalAssessors();
      if (error) throw error;
      setAssessors(data);
    } catch (err) {
      console.error('Error fetching assessors:', err);
      setError('Failed to load external assessors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteLink = (assessor: ExternalAssessor) => {
    const inviteUrl = `${window.location.origin}/external-assessment/${assessor.invitation_code}`;
    navigator.clipboard.writeText(inviteUrl);
    
    // Update the copied status for this specific assessor
    setCopiedCodes({
      ...copiedCodes,
      [assessor.id]: true
    });
    
    toast.success('Invitation link copied to clipboard');
    
    // Reset the copied status after 3 seconds
    setTimeout(() => {
      setCopiedCodes(prev => ({
        ...prev,
        [assessor.id]: false
      }));
    }, 3000);
  };

  const handleResendInvitation = async (assessor: ExternalAssessor) => {
    try {
      const { success, error } = await resendInvitation(assessor.id);
      if (!success) throw error;
      
      toast.success(`Invitation link refreshed for ${assessor.email}`);
      
      // If there's an email, also send an email
      if (assessor.email) {
        handleSendInvitationEmail(assessor);
      }
      
      await fetchAssessors(); // Refresh the list
    } catch (err) {
      console.error('Error resending invitation:', err);
      toast.error('Failed to resend invitation. Please try again.');
    }
  };

  const handleSendInvitationEmail = async (assessor: ExternalAssessor) => {
    if (!assessor.email) return;
    
    try {
      // Mark this specific assessor as loading
      setSendingEmails(prev => ({
        ...prev,
        [assessor.id]: true
      }));
      
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
        assessor.invitation_code,
        assessor.email,
        'assessor',
        senderName
      );
      
      if (!success) {
        throw error;
      }
      
      toast.success(`Invitation email sent to ${assessor.email}`);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      toast.error('Failed to send email. The invitation link will still work.');
    } finally {
      // Clear loading state for this assessor
      setSendingEmails(prev => ({
        ...prev,
        [assessor.id]: false
      }));
    }
  };

  const openDeleteDialog = (assessor: ExternalAssessor) => {
    setAssessorToDelete(assessor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAssessor = async () => {
    if (!assessorToDelete) return;
    
    try {
      const { success, error } = await removeExternalAssessor(assessorToDelete.id);
      if (!success) throw error;
      
      setAssessors(assessors.filter(a => a.id !== assessorToDelete.id));
      toast.success(`Assessor ${assessorToDelete.email} has been removed`);
      setSuccessMessage(`Assessor ${assessorToDelete.email} has been removed successfully.`);
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error removing assessor:', err);
      toast.error('Failed to remove assessor. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setAssessorToDelete(null);
    }
  };

  const handleInviteSuccess = async () => {
    await fetchAssessors();
    // Find the most recently created assessor (by created_at)
    if (assessors.length > 0) {
      const sorted = [...assessors].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLatestAssessor(sorted[0]);
      setShowInviteModal(true);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8" style={{ 
        background: 'linear-gradient(90deg, #ff0099, #9900ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        External Assessors
      </h1>

      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Modal for invite link */}
      {showInviteModal && latestAssessor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" ref={inviteModalRef}>
          <div className="relative bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
            {/* Gradient Brand Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-center">
              <h2 className="text-xl font-bold text-white">Invitation Created!</h2>
            </div>
            <div className="p-6 pb-16 relative max-h-[60vh] overflow-y-auto">
              <p className="mb-4 text-gray-700 text-center">
                Copy and share this link with your assessor to complete the process.
              </p>
              <div className="flex flex-col items-center">
                <input
                  value={`${window.location.origin}/external-assessment/${latestAssessor.invitation_code}`}
                  readOnly
                  className="w-full mb-2 p-2 border rounded text-center text-sm"
                  onFocus={e => e.target.select()}
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/external-assessment/${latestAssessor.invitation_code}`);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center gap-2"
                >
                  <span>Copy Link</span>
                </Button>
              </div>
              {/* Explicit scroll instruction */}
              <div className="mt-8 text-xs text-center text-gray-500">
                Scroll down to copy your invitation link and send it to your assessor.
              </div>
              {/* Gradient fade at bottom */}
              <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
            </div>
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-pink-500 text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <InviteAssessor onSuccess={handleInviteSuccess} />
          
          <Card className="mt-6 bg-blue-50 border-blue-100">
            <CardContent className="p-4 text-sm">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-600 border-blue-200">Tip</Badge>
                Best Way to Share Invitations
              </h3>
              <p className="text-blue-700 mb-2">
                Copy the invitation link and share it directly with your assessor via:
              </p>
              <ul className="list-disc list-inside text-blue-600 space-y-1">
                <li>Text message</li>
                <li>WhatsApp</li>
                <li>Messenger</li>
                <li>Any messaging app</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-4 bg-purple-50 border-purple-100">
            <CardContent className="p-4 text-sm">
              <h3 className="font-semibold text-purple-800 mb-2">
                About The Cog Effect
              </h3>
              <p className="text-purple-700 mb-3">
                Love Mirror was inspired by The Cog Effect - a guide for building healthier relationship awareness.
              </p>
              <a 
                href="https://www.amazon.co.uk/dp/B0BM8H9D12" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
              >
                Learn more
                <ArrowUpRight className="ml-1 h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your External Assessors</CardTitle>
              <CardDescription>
                People you've invited to provide an external assessment of your qualities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p>Loading assessors...</p>
                </div>
              ) : assessors.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">You haven't invited any external assessors yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <div className="inline-block min-w-full align-middle px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead className="hidden sm:table-cell">Relationship</TableHead>
                          <TableHead className="hidden md:table-cell">Assessment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assessors.map((assessor) => (
                          <TableRow key={assessor.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span className="truncate max-w-[180px]">{assessor.email}</span>
                                <span className="capitalize text-xs text-muted-foreground sm:hidden">{assessor.relationship}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell capitalize">{assessor.relationship}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              {getAssessmentTypeName(assessor.assessment_type)}
                            </TableCell>
                            <TableCell>
                              {assessor.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end items-center space-x-2">
                                <TooltipWrapper content="Copy invitation link (best practice)">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyInviteLink(assessor)}
                                    className={`${copiedCodes[assessor.id] ? "border-green-500 bg-green-50 text-green-600" : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                                  >
                                    {copiedCodes[assessor.id] ? (
                                      <span className="flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Copied</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center">
                                        <Copy className="h-4 w-4 mr-2" />
                                        <span className="hidden sm:inline">Copy Link</span>
                                      </span>
                                    )}
                                  </Button>
                                </TooltipWrapper>
                                
                                {assessor.status === 'pending' && (
                                  <>
                                    <TooltipWrapper content="Send email invitation">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSendInvitationEmail(assessor)}
                                        disabled={sendingEmails[assessor.id]}
                                        className="border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                      >
                                        {sendingEmails[assessor.id] ? (
                                          <span className="flex items-center">
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            <span className="hidden sm:inline">Sending...</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center">
                                            <Send className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">Email</span>
                                          </span>
                                        )}
                                      </Button>
                                    </TooltipWrapper>
                                    
                                    <TooltipWrapper content="Refresh invitation link">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResendInvitation(assessor)}
                                        className="border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
                                      >
                                        <span className="flex items-center">
                                          <RefreshCw className="h-4 w-4 mr-2" />
                                          <span className="hidden sm:inline">Refresh</span>
                                        </span>
                                      </Button>
                                    </TooltipWrapper>
                                  </>
                                )}
                                
                                <TooltipWrapper content="Remove assessor">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog(assessor)}
                                    className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                  >
                                    <span className="flex items-center">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      <span className="hidden sm:inline">Remove</span>
                                    </span>
                                  </Button>
                                </TooltipWrapper>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAssessor}
        title="Remove External Assessor"
        description={`Are you sure you want to remove ${assessorToDelete?.email}? This action cannot be undone.`}
      />
    </div>
  );
}