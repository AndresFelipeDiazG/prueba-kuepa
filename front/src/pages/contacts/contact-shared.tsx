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

export const emptyForm: ContactForm = {
  first_name: '', last_name: '', email: '', number: '', document_type: 'cc', document: '',
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
  if (!value.first_name.trim()) errors.first_name = 'El nombre es obligatorio'
  else if (value.first_name.trim().length < 2 || !namePattern.test(value.first_name.trim())) errors.first_name = 'El nombre no es válido'
  if (!value.last_name.trim()) errors.last_name = 'El apellido es obligatorio'
  else if (value.last_name.trim().length < 2 || !namePattern.test(value.last_name.trim())) errors.last_name = 'El apellido no es válido'
  if (value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email.trim())) errors.email = 'Ingresa un correo electrónico válido'
  if (!/^\d{10}$/.test(phone)) errors.number = 'El teléfono debe tener exactamente 10 dígitos'
  if (!value.document_type) errors.document_type = 'Selecciona un tipo de documento'
  if (!/^\d{4,20}$/.test(document)) errors.document = 'El documento debe tener entre 4 y 20 dígitos'
  return errors
}

export function FieldError ({ message }: { message?: string }) { return message ? <small className="crm-field-error" role="alert">{message}</small> : null }
export function ModalPortal ({ children }: { children: ReactNode }) { return createPortal(children, document.body) }
