interface LeadDuplicateCandidate {
  mobile_phone: string
  document_type: string
  document: string
}

interface ExistingLeadLike {
  mobile_phone?: string
  document_type?: string
  document?: string
}

export const getDuplicateLeadErrors = (
  existing: ExistingLeadLike | null | undefined,
  candidate: LeadDuplicateCandidate,
): Record<string, string> => {
  if (!existing) return {}

  const errors: Record<string, string> = {}
  if (existing.mobile_phone === candidate.mobile_phone) {
    errors.mobile_phone = 'Ya existe un lead con este teléfono'
  }
  if (existing.document_type === candidate.document_type && existing.document === candidate.document) {
    errors.document = 'Ya existe un lead con este documento'
  }

  return errors
}
