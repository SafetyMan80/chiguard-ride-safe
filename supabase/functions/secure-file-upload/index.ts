import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { fileName, fileSize, mimeType, bucketName } = await req.json()

    // Server-side file validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
    ]
    const maxFileSize = 10 * 1024 * 1024 // 10MB

    // Validate file size
    if (fileSize > maxFileSize) {
      return new Response(
        JSON.stringify({ 
          error: 'File size exceeds maximum allowed size of 10MB',
          code: 'FILE_TOO_LARGE'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate MIME type
    if (!allowedTypes.includes(mimeType)) {
      return new Response(
        JSON.stringify({ 
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate file extension matches MIME type
    const validExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf']
    }

    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
    const expectedExtensions = validExtensions[mimeType as keyof typeof validExtensions]
    
    if (!expectedExtensions?.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ 
          error: 'File extension does not match MIME type',
          code: 'EXTENSION_MISMATCH'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Additional security checks
    const suspiciousPatterns = [
      /\.exe$/i, /\.scr$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.pif$/i,
      /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.php$/i, /\.asp$/i, /\.aspx$/i
    ]

    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
      return new Response(
        JSON.stringify({ 
          error: 'Suspicious file detected',
          code: 'SUSPICIOUS_FILE'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful validation
    await supabase.rpc('log_security_audit', {
      _action_type: 'FILE_UPLOAD_VALIDATED',
      _resource_type: 'STORAGE',
      _resource_id: null,
      _additional_data: {
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        bucket: bucketName,
        user_id: user.id
      }
    })

    // Generate secure upload path
    const timestamp = new Date().toISOString().split('T')[0]
    const randomId = crypto.randomUUID().slice(0, 8)
    const securePath = `${user.id}/${timestamp}/${randomId}_${fileName}`

    return new Response(
      JSON.stringify({ 
        success: true,
        securePath,
        message: 'File validation passed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('File validation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'File validation failed',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})