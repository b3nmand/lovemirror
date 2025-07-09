import { serve } from "npm:@supabase/functions-js@2.1.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

interface EmailParams {
  invitationCode: string;
  email: string;
  senderName?: string;
  invitationType: "partner" | "assessor";
}

serve(async (req: Request) => {
  try {
    // Set up CORS headers
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        },
      });
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invitation details from request body
    let params: EmailParams;
    try {
      params = await req.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request format" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
    
    const { invitationCode, email, senderName, invitationType } = params;

    // Validate required parameters
    if (!invitationCode || !email || !invitationType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required parameters",
          params: { invitationCode, email, invitationType }
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Verify the invitation exists
    let invitationData;
    if (invitationType === "partner") {
      const { data: invitation, error } = await supabase
        .from("partner_invitations")
        .select("*")
        .eq("invitation_code", invitationCode)
        .eq("status", "pending")
        .single();

      if (error) {
        console.error("Partner invitation verification error:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid invitation", details: error }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
      invitationData = invitation;
    } else {
      const { data: invitation, error } = await supabase
        .from("external_assessors")
        .select("*")
        .eq("invitation_code", invitationCode)
        .eq("status", "pending")
        .single();

      if (error) {
        console.error("Assessor verification error:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid invitation", details: error }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
      invitationData = invitation;
    }

    // Construct invitation URL
    const baseUrl = Deno.env.get("SITE_URL") || "https://app.lovemirror.com";
    const invitationUrl = invitationType === "partner"
      ? `${baseUrl}/invitation/${invitationCode}`
      : `${baseUrl}/external-assessment/${invitationCode}`;

    // Get sender info if not provided
    let sender = senderName || "Someone";
    if (!senderName && invitationData.sender_id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", invitationData.sender_id)
          .single();
        
        if (profile?.name) {
          sender = profile.name;
        } else {
          // Try to get from public.users table
          const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", invitationData.sender_id)
            .single();
            
          if (userData?.name) {
            sender = userData.name;
          }
        }
      } catch (profileError) {
        console.error("Error fetching sender profile:", profileError);
        // Continue with default sender name
      }
    }

    // Email template based on invitation type
    let subject, html;
    if (invitationType === "partner") {
      subject = `${sender} has invited you to connect on Love Mirror`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Love Mirror Invitation</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; padding: 20px; margin: 0;">
            <!-- Banner Ad -->
            <div style="background-color: #D72638; padding: 15px; color: #ffffff; text-align: center;">
              <strong>The Cog Effect</strong><br>
              <a href="https://www.amazon.co.uk/dp/B0BM8H9D12" style="color: #ffffff; font-weight: bold;">Discover the book that inspired LoveMirror</a><br>
              <span style="font-size: 13px;">A light-hearted but powerful guide to building healthy relationships</span>
            </div>

            <!-- Body -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
              <h2 style="margin-top: 30px;">💑 You've Been Invited by ${sender}</h2>
              <p>
                ${sender} wants you to join them on LoveMirror — a relationship intelligence tool that shows how well you're aligned across communication, emotional connection, values, and more.
              </p>
              <p>
                By completing the compatibility assessment, you'll both unlock a shared compatibility score and discover how you grow together.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                  Start the Compatibility Test
                </a>
              </div>

              <!-- Footer -->
              <p style="font-size: 14px;">
                P.S. LoveMirror was built using the principles of <strong>The Cog Effect</strong> — a guide for improving love, unity, and emotional awareness in relationships. Check it out <a href="https://www.amazon.co.uk/dp/B0BM8H9D12">here</a>.
              </p>
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">© LoveMirror | Real insights. Real growth.</p>
            </div>
          </body>
        </html>
      `;
    } else {
      subject = `${sender} has requested your feedback on Love Mirror`;
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Love Mirror Assessment Request</title>
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #ffffff; color: #333333; padding: 20px; margin: 0;">
            <!-- Banner Ad -->
            <div style="background-color: #D72638; padding: 15px; color: #ffffff; text-align: center;">
              <strong>The Cog Effect</strong><br>
              <a href="https://www.amazon.co.uk/dp/B0BM8H9D12" style="color: #ffffff; font-weight: bold;">Discover the book that inspired LoveMirror</a><br>
              <span style="font-size: 13px;">A light-hearted but powerful guide to building healthy relationships</span>
            </div>

            <!-- Body -->
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
              <h2 style="margin-top: 30px;">👋 ${sender} Invited You to Give Anonymous Feedback</h2>
              <p>
                ${sender} has asked you to complete a short, anonymous assessment about how you experience them in relationships — as a friend, sibling, parent, or partner.
              </p>
              <p>
                This feedback helps them grow through LoveMirror's unique <strong>Delusional Score</strong> feature, which compares self-view vs. external perception.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">
                  Start the Anonymous Assessment
                </a>
              </div>

              <!-- Footer -->
              <p style="font-size: 14px;">
                P.S. The LoveMirror app was inspired by <strong>The Cog Effect</strong> — a deeply insightful relationship guide designed to help couples grow with clarity and purpose. Learn more <a href="https://www.amazon.co.uk/dp/B0BM8H9D12">here</a>.
              </p>
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">© LoveMirror | Clarity. Accountability. Real growth.</p>
            </div>
          </body>
        </html>
      `;
    }

    try {
      // In a production environment, you would use a real email service here.
      // For this example, we'll log the details and simulate success
      
      console.log(`[EMAIL] Would send email to: ${email}`);
      console.log(`[EMAIL] Subject: ${subject}`);
      console.log(`[EMAIL] URL in email: ${invitationUrl}`);
      
      // Simulating email sending success
      // In production, replace this with your actual email sending code using a service like Resend, SendGrid, etc.
      /*
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`
        },
        body: JSON.stringify({
          from: "invitations@lovemirror.app",
          to: email,
          subject: subject,
          html: html
        })
      });
      
      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(`Email service error: ${JSON.stringify(errorData)}`);
      }
      */
      
      // Update the invitation with the email if it's not already set
      if (invitationType === "partner" && !invitationData.email) {
        await supabase
          .from("partner_invitations")
          .update({ email: email })
          .eq("id", invitationData.id);
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // We'll continue even if email sending fails - the user can still copy the link
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to send email",
          message: "Email service unavailable, but the invitation has been created. You can copy the link manually."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation email sent successfully",
        debug: {
          to: email,
          url: invitationUrl,
          type: invitationType
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error) {
    console.error("Error in invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});