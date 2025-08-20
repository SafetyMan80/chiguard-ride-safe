import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the webhook payload
    const payload = await req.json();
    console.log('📧 New signup webhook received:', payload);

    // Extract user information from the webhook
    const { record: user } = payload;
    
    if (!user) {
      console.error('No user data in webhook payload');
      return new Response('No user data', { status: 400 });
    }

    // Prepare email content
    const signupTime = new Date(user.created_at).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">🎉 New RailSafe User Signup</h2>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">User Details:</h3>
          <p><strong>Email:</strong> ${user.email || 'Not provided'}</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>Signup Time:</strong> ${signupTime} CST</p>
          <p><strong>Email Confirmed:</strong> ${user.email_confirmed_at ? 'Yes' : 'Pending'}</p>
          ${user.raw_user_meta_data ? `<p><strong>Additional Info:</strong> ${JSON.stringify(user.raw_user_meta_data, null, 2)}</p>` : ''}
        </div>
        
        <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af;">
            <strong>Quick Actions:</strong><br>
            • Check user profile in your Supabase dashboard<br>
            • Monitor user activity and engagement<br>
            • Welcome the user if appropriate
          </p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          This notification was automatically sent by RailSafe when a new user signed up.
        </p>
      </div>
    `;

    // Send email notification
    const emailResult = await resend.emails.send({
      from: 'RailSafe Notifications <notifications@railsafeapp.com>',
      to: ['info@railsafeapp.com'],
      subject: `🎉 New RailSafe User: ${user.email || 'Unknown'}`,
      html: emailContent,
    });

    if (emailResult.error) {
      console.error('❌ Failed to send signup notification email:', emailResult.error);
      throw emailResult.error;
    }

    console.log('✅ Signup notification email sent successfully:', emailResult.data);

    // Log the signup event for analytics via RPC
    const { error: trackError } = await supabase.rpc('track_event', {
      _event_type: 'admin_notification_sent',
      _event_data: {
        notification_type: 'new_user_signup',
        user_email: user.email,
        user_id: user.id,
        email_id: emailResult.data?.id
      }
    });
    if (trackError) {
      console.error('❌ Failed to record analytics event:', trackError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Signup notification sent',
        email_id: emailResult.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error in notify-new-signup function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process signup notification'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});