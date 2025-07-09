-- Create storage bucket for group chat photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-chat-photos', 'group-chat-photos', true);

-- Create storage policies for group chat photos
CREATE POLICY "Anyone can view group chat photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'group-chat-photos');

CREATE POLICY "Users can upload group chat photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'group-chat-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own group chat photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'group-chat-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add image_url column to group_messages table for photo attachments
ALTER TABLE public.group_messages 
ADD COLUMN image_url TEXT;