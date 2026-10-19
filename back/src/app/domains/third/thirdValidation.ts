const NAME_PATTERN = /^[\p{L}\s'-]+$/u
const DOCUMENT_TYPES = ['cc', 'ti', 'pp', 'nt'] as const
const BIRTHDATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Departamentos de Colombia (el valor se guarda igual a la etiqueta). */
export const DEPARTMENTS: readonly string[] = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Bogotá D.C.', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
  'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
]

export const EDUCATION_LEVELS: readonly string[] = [
  'none', 'primary', 'secondary', 'technician', 'technologist', 'undergraduate',
  'specialization', 'master', 'doctorate',
]

export type ContactInput = {
  first_name?: unknown
  last_name?: unknown
  email?: unknown
  number?: unknown
  document_type?: unknown
  document?: unknown
  birthdate?: unknown
  city?: unknown
  department?: unknown
  educationLevel?: unknown
  tags?: unknown
  responsible?: unknown
  origin?: unknown
  interestProgram?: unknown
  lead_status?: unknown
  incremental?: unknown
  trackings?: unknown
}

export type ContactValue = {
  first_name: string
  last_name: string
  email: string
  number: string
  document_type: typeof DOCUMENT_TYPES[number]
  document: string
  birthdate?: string
  city?: string
  department?: string
  educationLevel?: string
  tags: string[]
  responsible?: string
  origin?: string
  interestProgram?: string
  lead_status?: 'active' | 'inactive'
  incremental?: number
  trackings?: unknown[]
}

export type ContactValidationResult = {
  value?: ContactValue
  errors: Record<string, string>
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : ''

const normalizeTags = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return [...new Set(values.map(tag => text(tag)).filter(Boolean))].slice(0, 20)
}

export const validateContactInput = (input: ContactInput): ContactValidationResult => {
  const firstName = text(input.first_name)
  const lastName = text(input.last_name)
  const email = text(input.email)
  const number = text(input.number)
  const documentType = text(input.document_type)
  const document = text(input.document)
  const birthdate = text(input.birthdate)
  const city = text(input.city)
  const department = text(input.department)
  const educationLevel = text(input.educationLevel)
  const tags = normalizeTags(input.tags)
  const errors: Record<string, string> = {}

  if (!firstName) errors.first_name = 'El nombre es obligatorio'
  else if (firstName.length < 2) errors.first_name = 'El nombre debe tener al menos 2 caracteres'
  else if (!NAME_PATTERN.test(firstName)) errors.first_name = 'El nombre solo puede contener letras y espacios'

  if (!lastName) errors.last_name = 'El apellido es obligatorio'
  else if (lastName.length < 2) errors.last_name = 'El apellido debe tener al menos 2 caracteres'
  else if (!NAME_PATTERN.test(lastName)) errors.last_name = 'El apellido solo puede contener letras y espacios'

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Ingresa un correo electrónico válido'
  if (!number) errors.number = 'El teléfono es obligatorio'
  else if (!/^\d+$/.test(number)) errors.number = 'El teléfono solo puede contener números'
  else if (number.length !== 10) errors.number = 'El teléfono debe tener exactamente 10 dígitos'
  if (!DOCUMENT_TYPES.includes(documentType as typeof DOCUMENT_TYPES[number])) errors.document_type = 'Selecciona un tipo de documento'
  if (!document) errors.document = 'El documento es obligatorio'
  else if (!/^\d+$/.test(document)) errors.document = 'El documento solo puede contener números'
  else if (document.length < 4 || document.length > 20) errors.document = 'El documento debe tener entre 4 y 20 dígitos'

  if (birthdate) {
    const parsed = BIRTHDATE_PATTERN.test(birthdate) ? new Date(`${birthdate}T00:00:00`) : null
    if (!parsed || Number.isNaN(parsed.getTime())) errors.birthdate = 'La fecha de nacimiento no es válida'
    else if (parsed.getTime() > Date.now()) errors.birthdate = 'La fecha de nacimiento no puede ser futura'
    else if (parsed.getFullYear() < 1900) errors.birthdate = 'La fecha de nacimiento no es válida'
  }
  if (city.length > 80) errors.city = 'La ciudad no puede superar 80 caracteres'
  if (department && !DEPARTMENTS.includes(department)) errors.department = 'Selecciona un departamento válido'
  if (educationLevel && !EDUCATION_LEVELS.includes(educationLevel)) errors.educationLevel = 'Selecciona un nivel de escolaridad válido'

  if (Object.keys(errors).length > 0) return { errors }

  return {
    errors,
    value: {
      first_name: firstName,
      last_name: lastName,
      email,
      number,
      document_type: documentType as typeof DOCUMENT_TYPES[number],
      document,
      tags,
      ...(birthdate ? { birthdate } : {}),
      ...(city ? { city } : {}),
      ...(department ? { department } : {}),
      ...(educationLevel ? { educationLevel } : {}),
      ...(typeof input.responsible === 'string' && input.responsible.trim() ? { responsible: input.responsible.trim() } : {}),
      ...(typeof input.origin === 'string' && input.origin.trim() ? { origin: input.origin.trim() } : {}),
      ...(typeof input.interestProgram === 'string' && input.interestProgram.trim() ? { interestProgram: input.interestProgram.trim() } : {}),
      ...(['active', 'inactive'].includes(text(input.lead_status)) ? { lead_status: text(input.lead_status) as 'active' | 'inactive' } : {}),
      ...(Number.isFinite(Number(input.incremental)) ? { incremental: Number(input.incremental) } : {}),
      ...(Array.isArray(input.trackings) ? { trackings: input.trackings } : {}),
    },
  }
}
