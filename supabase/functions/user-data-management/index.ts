import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, userId } = await req.json();

    if (action === "export") {
      // Export user data
      const { data, error } = await supabase.rpc("export_user_data", {
        _user_id: userId || user.id
      });

      if (error) throw error;

      // Log the security event
      await supabase.rpc("log_security_audit", {
        _action_type: "DATA_EXPORT_API",
        _resource_type: "USER_DATA",
        _resource_id: userId || user.id,
        _additional_data: { 
          api_request: true,
          user_agent: req.headers.get("User-Agent"),
          ip: req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For")
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          data: data,
          exportDate: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="railsafe-data-export-${new Date().toISOString().split('T')[0]}.json"`
          }
        }
      );

    } else if (action === "delete") {
      // Confirm deletion request
      const { data, error } = await supabase.rpc("delete_user_data", {
        _user_id: userId || user.id
      });

      if (error) throw error;

      // Log the security event
      await supabase.rpc("log_security_audit", {
        _action_type: "DATA_DELETION_API",
        _resource_type: "USER_DATA", 
        _resource_id: userId || user.id,
        _additional_data: {
          api_request: true,
          user_agent: req.headers.get("User-Agent"),
          ip: req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For")
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "User data successfully deleted",
          deletionDate: new Date().toISOString()
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );

    } else {
      throw new Error("Invalid action");
    }

  } catch (error: any) {
    console.error("Error in user-data-management function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});