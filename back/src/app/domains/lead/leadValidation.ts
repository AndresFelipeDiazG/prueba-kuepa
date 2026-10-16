import { DOCUMENT_TYPES, LEAD_ORIGINS, DocumentType, LeadOrigin } from './leadTypes'
import { normalizeTags } from './leadStageRules'

export interface LeadInput {
  first_name?: unknown
  last_name?: unknown
  email?: unknown
  mobile_phone?: unknown
  document_type?: unknown
  document?: unknown
  responsible?: unknown
  origin?: unknown
  tags?: unknown
  interestProgram?: unknown
  stage?: unknown
}

export interface ValidatedLeadInput {
  first_name: string
  last_name: string
  email: string
  mobile_phone: string
  document_type: DocumentType
  document: string
  responsible: string
  origin: LeadOrigin
  tags: string[]
  interestProgram: string
  stage: string
}

export interface LeadValidationResult {
  value?: ValidatedLeadInput
  errors: Record<string, string>
}

const asTrimmedString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

export const validateLeadInput = (input: LeadInput): LeadValidationResult => {
  const firstName = asTrimmedString(input.first_name)
  const lastName = asTrimmedString(input.last_name)
  const email = asTrimmedString(input.email).toLowerCase()
  const mobilePhone = asTrimmedString(input.mobile_phone)
  const document = asTrimmedString(input.document)
  const documentType = asTrimmedString(input.document_type)
  const responsible = asTrimmedString(input.responsible)
  const origin = asTrimmedString(input.origin)
  const interestProgram = asTrimmedString(input.interestProgram)
  const stage = asTrimmedString(input.stage)
  const errors: Record<string, string> = {}

  if (!firstName) errors.first_name = 'El nombre es obligatorio'
  if (!lastName) errors.last_name = 'El apellido es obligatorio'
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'El correo electrónico no es válido'
  if (!mobilePhone) errors.mobile_phone = 'El teléfono es obligatorio'
  if (!DOCUMENT_TYPES.includes(documentType as DocumentType)) errors.document_type = 'El tipo de documento no es válido'
  if (!document) errors.document = 'El documento es obligatorio'
  if (!responsible) errors.responsible = 'El responsable es obligatorio'
  if (!LEAD_ORIGINS.includes(origin as LeadOrigin)) errors.origin = 'El origen no es válido'
  if (!interestProgram) errors.interestProgram = 'El programa es obligatorio'
  if (!stage) errors.stage = 'La etapa es obligatoria'

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    value: {
      first_name: firstName,
      last_name: lastName,
      email,
      mobile_phone: mobilePhone,
      document_type: documentType as DocumentType,
      document,
      responsible,
      origin: origin as LeadOrigin,
      tags: normalizeTags(input.tags),
      interestProgram,
      stage,
    },
  }
}
