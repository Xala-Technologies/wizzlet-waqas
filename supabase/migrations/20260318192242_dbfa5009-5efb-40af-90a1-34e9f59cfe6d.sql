
-- Create storage buckets for creator images
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- RLS: Anyone can view files in public buckets
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'banners'));

-- RLS: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload banners" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Users can update/delete their own files
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own banners" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own banners" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'banners' AND (storage.foldername(name))[1] = auth.uid()::text);
