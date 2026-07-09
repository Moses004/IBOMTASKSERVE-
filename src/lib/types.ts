export type UserRole = 'customer' | 'tasker' | 'admin'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  avatar_url: string | null
  city: string | null
  is_suspended: boolean
  created_at: string
  updated_at: string
}

export interface TaskerProfile {
  id: string
  bio: string | null
  years_experience: number
  verification_status: VerificationStatus
  id_document_url: string | null
  avg_rating: number
  total_jobs: number
  is_available: boolean
  created_at: string
  updated_at: string
}
