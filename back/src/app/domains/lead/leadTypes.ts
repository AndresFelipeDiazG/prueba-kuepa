export const LEAD_ORIGINS = [
  'website',
  'facebook',
  'instagram',
  'whatsapp',
  'referral',
  'other',
] as const

export type LeadOrigin = typeof LEAD_ORIGINS[number]

export const DOCUMENT_TYPES = ['cc', 'ti', 'pp', 'nt'] as const

export type DocumentType = typeof DOCUMENT_TYPES[number]
