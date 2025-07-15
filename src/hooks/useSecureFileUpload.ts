import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadOptions {
  bucket: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export const useSecureFileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
    file: File, 
    options: UploadOptions
  ): Promise<string | null> => {
    setUploading(true);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required");
      }

      // First, validate the file on the server
      const validationResponse = await supabase.functions.invoke(
        'secure-file-upload',
        {
          body: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            bucketName: options.bucket
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (validationResponse.error) {
        throw new Error(validationResponse.error.message || "Validation failed");
      }

      const { securePath } = validationResponse.data;

      // If validation passes, upload to storage using the secure path
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(securePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(uploadData.path);

      toast.success("File uploaded successfully");
      return publicUrl;

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle specific error codes
      const errorMessage = error.message?.includes('FILE_TOO_LARGE') 
        ? "File is too large. Maximum size is 10MB."
        : error.message?.includes('INVALID_FILE_TYPE')
        ? "File type not allowed. Please use JPG, PNG, GIF, WebP, or PDF files."
        : error.message?.includes('EXTENSION_MISMATCH')
        ? "File extension doesn't match the file type."
        : error.message?.includes('SUSPICIOUS_FILE')
        ? "File appears to be suspicious and cannot be uploaded."
        : error.message || "Upload failed";

      toast.error(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFile,
    uploading
  };
};