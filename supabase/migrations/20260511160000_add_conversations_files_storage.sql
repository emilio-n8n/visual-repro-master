-- Migration: Add conversations-files storage bucket with RLS
-- Run this in Supabase SQL editor or apply via supabase CLI

-- Create the storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conversations-files',
  'conversations-files',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: anyone authenticated can upload to their own folder
CREATE POLICY "Authenticated users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: anyone can read files (public bucket)
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'conversations-files');

-- Policy: users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: users can update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
