import { supabase } from './supabase';

/**
 * Send an invitation email
 * @param invitationCode The unique invitation code
 * @param email The recipient's email address
 * @param invitationType Whether this is a partner or assessor invitation
 * @param senderName Optional name of the sender
 * @returns Object indicating success or failure
 */
export async function sendInvitationEmail(
  invitationCode: string,
  email: string,
  invitationType: 'partner' | 'assessor',
  senderName?: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Get user profile for sender name if not provided
    if (!senderName) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
          
        if (profile?.name) {
          senderName = profile.name;
        }
      }
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Call our edge function to send the email
    const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        invitationCode,
        email,
        senderName,
        invitationType
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Email API error:', data);
      throw new Error(data.error || 'Failed to send invitation email');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
}