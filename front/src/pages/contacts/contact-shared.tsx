/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { ContactPayload } from '@/services/thirdService'

export type Related = string | { _id: string; name?: string; username?: string; profile?: { first_name?: string; last_name?: string } } | null
export type Program = { _id: string; name: string }
export type Assignee = { _id: string; username?: string; profile?: { first_name?: string; last_name?: string } }
export type Note = { _id?: string; text: string; created_at?: string; user?: Related }

export type Contact = Omit<ContactPayload, 'responsible' | 'interestProgram'> & {
  _id: string
  name?: string
  created_at?: string
  updated_at?: string
  incremental?: number
  mobile_phone?: string
  trackings?: Array<{ tracking?: Related; description?: string }>
  responsible?: Related
  interestProgram?: Related
  notes?: Note[]
}

export type ContactForm = {
  first_name: string
  last_name: string
  email: string
  number: string
  document_type: string
  document: string
  birthdate: string
  city: string
  department: string
  educationLevel: string
  responsible: string
  origin: string
  interestProgram: string
  tags: string[]
}

export type ContactFieldErrors = Partial<Record<keyof ContactForm, string>>

export const documentTypes = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'pp', label: 'Pasaporte' },
  { value: 'nt', label: 'NIT' },
]

export const origins = [
  { value: 'website', label: 'Sitio web' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referido' },
  { value: 'other', label: 'Otro' },
]

/** Departamentos de Colombia (el valor se guarda igual a la etiqueta). */
export const departments = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Bogotá D.C.', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
  'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
]

export const departmentOptions = departments.map(department => ({ value: department, label: department }))

export const educationLevels = [
  { value: 'none', label: 'Ninguno' },
  { value: 'primary', label: 'Primaria' },
  { value: 'secondary', label: 'Bachillerato' },
  { value: 'technician', label: 'Técnico' },
  { value: 'technologist', label: 'Tecnólogo' },
  { value: 'undergraduate', label: 'Pregrado' },
  { value: 'specialization', label: 'Especialización' },
  { value: 'master', label: 'Maestría' },
  { value: 'doctorate', label: 'Doctorado' },
]

export const emptyForm: ContactForm = {
  first_name: '', last_name: '', email: '', number: '', document_type: 'cc', document: '',
  birthdate: '', city: '', department: '', educationLevel: '',
  responsible: '', origin: '', interestProgram: '', tags: [],
}

export const idOf = (value: Related): string => typeof value === 'string' ? value : value?._id || ''
export const relatedLabel = (value: Related): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.name) return value.name
  if (value.username) return value.username
  return `${value.profile?.first_name || ''} ${value.profile?.last_name || ''}`.trim()
}
export const contactName = (contact: Partial<ContactForm> | Partial<Contact>): string => `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contacto sin nombre'
export const initialsOf = (contact: Partial<ContactForm> | Partial<Contact>): string => contactName(contact).split(' ').map(part => part[0] || '').join('').slice(0, 2).toUpperCase()
export const documentTypeLabel = (value?: string) => documentTypes.find(item => item.value === value)?.label || value || 'Sin tipo'
export const originLabel = (value?: string) => origins.find(item => item.value === value)?.label || value || 'Sin origen'
export const educationLevelLabel = (value?: string) => educationLevels.find(item => item.value === value)?.label || value || 'Sin nivel'

export const normalizeText = (value: string): string => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export const matchDepartment = (value: string): string => {
  const key = normalizeText(value).replace(/[^a-z0-9]/g, '')
  if (!key) return ''
  if (key === 'bogota' || key === 'bogotadc' || key === 'dc') return 'Bogotá D.C.'
  return departments.find(department => normalizeText(department).replace(/[^a-z0-9]/g, '') === key) || ''
}
export const matchOption = (value: string, options: Array<{ value: string; label: string }>): string => {
  const key = normalizeText(value)
  if (!key) return ''
  return options.find(item => normalizeText(item.value) === key || normalizeText(item.label) === key)?.value || ''
}
export const matchEducationLevel = (value: string): string => matchOption(value, educationLevels)

/** Acepta fechas 'YYYY-MM-DD' o 'DD/MM/AAAA' (también con guiones) y devuelve 'YYYY-MM-DD'. */
export const parseBirthdate = (value: string): string => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const local = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (local) return `${local[3]}-${local[2].padStart(2, '0')}-${local[1].padStart(2, '0')}`
  return ''
}

/** Fecha de nacimiento ('YYYY-MM-DD') para un input type="date". */
export const isoDate = (value?: string): string => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

/** Fecha de hoy ('YYYY-MM-DD') en la zona horaria local. */
export const todayIso = (): string => {
  const now = new Date()
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const birthdateLabel = (value?: string): string => {
  const iso = isoDate(value)
  const date = iso ? new Date(`${iso}T00:00:00`) : null
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' }).format(date) : 'Sin fecha'
}

/** Paleta del avatar con iniciales: tonos variados y sin morado. */
const avatarTones = [
  { soft: '#e3f1fd', strong: '#1668a8' },
  { soft: '#ddf2f1', strong: '#0f7b6c' },
  { soft: '#e3f4e5', strong: '#2f7d32' },
  { soft: '#eef3d9', strong: '#6d7519' },
  { soft: '#fdf1dc', strong: '#96631a' },
  { soft: '#fde8dc', strong: '#b24d1d' },
  { soft: '#fce3e3', strong: '#b3261e' },
  { soft: '#fde4ee', strong: '#b0246a' },
  { soft: '#ddf2f8', strong: '#0e6f8c' },
  { soft: '#f0e7e1', strong: '#6b4b34' },
  { soft: '#e3e8fb', strong: '#3b4fb8' },
  { soft: '#e9eef2', strong: '#4a5b67' },
]

/** Color estable: el mismo contacto siempre recibe el mismo tono, elegido al azar. */
export const avatarTone = (seed?: string): { soft: string; strong: string } => {
  const key = String(seed || '').trim().toLowerCase()
  if (!key) return avatarTones[0]
  let hash = 7
  for (let index = 0; index < key.length; index += 1) hash = (hash * 31 + key.charCodeAt(index)) % 99999989
  return avatarTones[hash % avatarTones.length]
}

export const relativeDate = (date?: string): string => {
  if (!date) return 'Sin fecha'
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000))
  if (hours < 1) return 'ahora'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} d`
}
export const fullDate = (date?: string): string => date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(date)) : 'Sin fecha'
export const normalizeTags = (tags: string[]): string[] => [...new Set(tags.map(tag => tag.trim()).filter(Boolean))].slice(0, 20)
export const responseMessage = (response: any): string => response?.message || 'No fue posible guardar el contacto'

export const formFromContact = (contact: Contact): ContactForm => ({
  first_name: contact.first_name || '',
  last_name: contact.last_name || '',
  email: contact.email || '',
  number: contact.number || '',
  document_type: contact.document_type || 'cc',
  document: contact.document || '',
  birthdate: isoDate(contact.birthdate),
  city: contact.city || '',
  department: contact.department || '',
  educationLevel: contact.educationLevel || '',
  responsible: idOf(contact.responsible),
  origin: contact.origin || '',
  interestProgram: idOf(contact.interestProgram),
  tags: contact.tags || [],
})

export const validateContactForm = (value: ContactForm): ContactFieldErrors => {
  const errors: ContactFieldErrors = {}
  const namePattern = /^[\p{L}\s'-]+$/u
  const phone = value.number.trim()
  const document = value.document.trim()
  const birthdate = value.birthdate.trim()
  if (!value.first_name.trim()) errors.first_name = 'El nombre es obligatorio'
  else if (value.first_name.trim().length < 2 || !namePattern.test(value.first_name.trim())) errors.first_name = 'El nombre no es válido'
  if (!value.last_name.trim()) errors.last_name = 'El apellido es obligatorio'
  else if (value.last_name.trim().length < 2 || !namePattern.test(value.last_name.trim())) errors.last_name = 'El apellido no es válido'
  if (value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email.trim())) errors.email = 'Ingresa un correo electrónico válido'
  if (!/^\d{10}$/.test(phone)) errors.number = 'El teléfono debe tener exactamente 10 dígitos'
  if (!value.document_type) errors.document_type = 'Selecciona un tipo de documento'
  if (!/^\d{4,20}$/.test(document)) errors.document = 'El documento debe tener entre 4 y 20 dígitos'
  if (birthdate) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(birthdate) ? new Date(`${birthdate}T00:00:00`) : null
    if (!parsed || Number.isNaN(parsed.getTime())) errors.birthdate = 'La fecha de nacimiento no es válida'
    else if (parsed.getTime() > Date.now()) errors.birthdate = 'La fecha de nacimiento no puede ser futura'
    else if (parsed.getFullYear() < 1900) errors.birthdate = 'La fecha de nacimiento no es válida'
  }
  if (value.city.trim().length > 80) errors.city = 'La ciudad no puede superar 80 caracteres'
  if (value.department && !departments.includes(value.department)) errors.department = 'Selecciona un departamento válido'
  if (value.educationLevel && !educationLevels.some(item => item.value === value.educationLevel)) errors.educationLevel = 'Selecciona un nivel de escolaridad válido'
  return errors
}

export function FieldError ({ message }: { message?: string }) { return message ? <small className="crm-field-error" role="alert">{message}</small> : null }
export function ModalPortal ({ children }: { children: ReactNode }) { return createPortal(children, document.body) }
