import { supabase } from './supabase'

/** Uploads a profile photo and returns its public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

/** Uploads an ID document to the private bucket and returns its storage path (not a URL). */
export async function uploadIdDocument(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/id-document.${ext}`

  const { error } = await supabase.storage
    .from('id-documents')
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) throw error
  return path
}

/** Mints a short-lived signed URL for a private ID document (owner or admin only, enforced by RLS). */
export async function getIdDocumentSignedUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const { data, error } = await supabase.storage
    .from('id-documents')
    .createSignedUrl(path, expiresInSeconds)

  if (error) throw error
  return data.signedUrl
}
