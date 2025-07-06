import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateFileUpload } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';

interface UploadOptions {
  bucket: string;
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
}

export const useSecureUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (
    file: File, 
    options: UploadOptions
  ): Promise<{ url: string | null; error: string | null }> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = validateFileUpload(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Additional validation based on options
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      if (options.maxSize && file.size > options.maxSize) {
        throw new Error(`File size exceeds ${Math.round(options.maxSize / 1024 / 1024)}MB limit`);
      }

      // Generate secure filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${randomString}_${sanitizedName}`;
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false, // Don't overwrite existing files
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(uploadData.path);

      return { url: publicUrl, error: null };
    } catch (error: any) {
      console.error('Secure upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return { url: null, error: error.message };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (
    bucket: string, 
    filePath: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('File deletion error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    uploadProgress,
  };
};