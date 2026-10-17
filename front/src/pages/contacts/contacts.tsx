import { app } from '@/atoms/kuepa'
import { useToast } from '@/components/hooks/use-toast'
import { leadService } from '@/services/leadService'
import { thirdService, type ContactPayload } from '@/services/thirdService'
import * as React from 'react'
import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { DesignSelect } from '@/components/ui/design-select'
import { CrmDateRange } from '@/components/ui/crm-date-range'

type Related = string | { _id: string; name?: string; username?: string; profile?: { first_name?: string; last_name?: string } } | null
type Program = { _id: string; name: string }
type Assignee = { _id: string; username?: string; profile?: { first_name?: string; last_name?: string } }
type Note = { _id?: string; text: string; created_at?: string; user?: Related }

type Contact = Omit<ContactPayload, 'responsible' | 'interestProgram'> & {
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

type ContactForm = {
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

type ContactFieldErrors = Partial<Record<keyof ContactForm, string>>
type ColumnKey = 'phone' | 'email' | 'document' | 'program' | 'responsible' | 'origin' | 'tags' | 'created'

type ContactFilters = {
  first_name: string
  last_name: string
  email: string
  number: string
  document: string
  document_type: string
  origin: string
  interestProgram: string
  responsible: string
  lead_status: string
  tags: string[]
  created_from: string
  created_to: string
}

const documentTypes = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'pp', label: 'Pasaporte' },
  { value: 'nt', label: 'NIT' },
]
const origins = [
  { value: 'website', label: 'Sitio web' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referido' },
  { value: 'other', label: 'Otro' },
]
const columnOptions: Array<{ key: ColumnKey; label: string; emoji: string }> = [
  { key: 'phone', label: 'Teléfono', emoji: '📞' },
  { key: 'email', label: 'Correo', emoji: '✉️' },
  { key: 'document', label: 'Documento', emoji: '🪪' },
  { key: 'program', label: 'Programa', emoji: '🎓' },
  { key: 'responsible', label: 'Responsable', emoji: '👤' },
  { key: 'origin', label: 'Origen', emoji: '🌐' },
  { key: 'tags', label: 'Etiquetas', emoji: '🏷️' },
  { key: 'created', label: 'Fecha de creación', emoji: '🗓️' },
]
const defaultColumns: ColumnKey[] = ['phone', 'document', 'program', 'tags', 'created']
const emptyForm: ContactForm = {
  first_name: '', last_name: '', email: '', number: '', document_type: 'cc', document: '',
  responsible: '', origin: '', interestProgram: '', tags: [],
}
const emptyFilters: ContactFilters = {
  first_name: '', last_name: '', email: '', number: '', document: '', document_type: '', origin: '',
  interestProgram: '', responsible: '', lead_status: '', tags: [], created_from: '', created_to: '',
}
const countActiveFilters = (value: ContactFilters): number => Object.values(value)
  .reduce((total: number, item) => total + (Array.isArray(item) ? (item.length ? 1 : 0) : (item ? 1 : 0)), 0)
const buildFilterParams = (value: ContactFilters): Record<string, string> => {
  const params: Record<string, string> = {}
  Object.entries(value).forEach(([key, item]) => {
    if (Array.isArray(item)) { if (item.length) params[key] = item.join(',') }
    else if (item) params[key] = String(item)
  })
  return params
}

const idOf = (value: Related): string => typeof value === 'string' ? value : value?._id || ''
const relatedLabel = (value: Related): string => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value.name) return value.name
  if (value.username) return value.username
  return `${value.profile?.first_name || ''} ${value.profile?.last_name || ''}`.trim()
}
const contactName = (contact: Partial<ContactForm> | Partial<Contact>): string => `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contacto sin nombre'
const initialsOf = (contact: Partial<ContactForm> | Partial<Contact>): string => contactName(contact).split(' ').map(part => part[0] || '').join('').slice(0, 2).toUpperCase()
const documentTypeLabel = (value?: string) => documentTypes.find(item => item.value === value)?.label || value || 'Sin tipo'
const originLabel = (value?: string) => origins.find(item => item.value === value)?.label || value || 'Sin origen'
const relativeDate = (date?: string): string => {
  if (!date) return 'Sin fecha'
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000))
  if (hours < 1) return 'ahora'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} d`
}
const fullDate = (date?: string): string => date ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(date)) : 'Sin fecha'
const normalizeTags = (tags: string[]): string[] => [...new Set(tags.map(tag => tag.trim()).filter(Boolean))].slice(0, 20)
const responseMessage = (response: any): string => response?.message || 'No fue posible guardar el contacto'

const validateContactForm = (value: ContactForm): ContactFieldErrors => {
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

function FieldError ({ message }: { message?: string }) { return message ? <small className="crm-field-error" role="alert">{message}</small> : null }
function ModalPortal ({ children }: { children: ReactNode }) { return createPortal(children, document.body) }

const normalizeHeader = (value: string): string => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
const parseCsv = (content: string): string[][] => {
  const rows: string[][] = []; let row: string[] = []; let value = ''; let quoted = false
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]; const next = content[index + 1]
    if (character === '"' && quoted && next === '"') { value += '"'; index += 1 }
    else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { row.push(value.trim()); value = '' }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && next === '\n') index += 1; row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = '' }
    else value += character
  }
  row.push(value.trim()); if (row.some(Boolean)) rows.push(row); return rows
}
const csvContactRows = (content: string): ContactForm[] => {
  const rows = parseCsv(content); if (rows.length < 2) return []
  const headers = rows[0].map(normalizeHeader)
  const read = (row: string[], names: string[]) => { const index = headers.findIndex(header => names.includes(header)); return index >= 0 ? row[index] || '' : '' }
  return rows.slice(1).map(row => {
    const name = read(row, ['name', 'nombrecompleto', 'contacto']).split(' ')
    return {
      first_name: read(row, ['firstname', 'nombre']) || name.shift() || '', last_name: read(row, ['lastname', 'apellido']) || name.join(' '),
      email: read(row, ['email', 'correo', 'correoelectronico']), number: read(row, ['number', 'phone', 'telefono', 'mobilephone']).replace(/\D/g, ''),
      document_type: read(row, ['documenttype', 'tipodedocumento']) || 'cc', document: read(row, ['document', 'documento', 'documentnumber']),
      responsible: read(row, ['responsible', 'responsable']), origin: read(row, ['origin', 'origen']), interestProgram: read(row, ['interestprogram', 'program', 'programa']),
      tags: normalizeTags(read(row, ['tags', 'etiquetas']).split(/[|;]/)),
    }
  }).filter(row => Object.values(row).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value)))
}

export default function Contacts () {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState(''); const [notice, setNotice] = useState('')
  const [filters, setFilters] = useState<ContactFilters>({ ...emptyFilters, tags: [] }); const [availableTags, setAvailableTags] = useState<string[]>([])
  const filterRef = useRef<HTMLDivElement>(null); const columnRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(25); const [total, setTotal] = useState(0); const [pages, setPages] = useState(1)
  const [showModal, setShowModal] = useState(false); const [showDetail, setShowDetail] = useState<Contact | null>(null); const [showImport, setShowImport] = useState(false)
  const [showFilters, setShowFilters] = useState(false); const [showColumnMenu, setShowColumnMenu] = useState(false); const [showActionMenu, setShowActionMenu] = useState(false)
  const [showNoteComposer, setShowNoteComposer] = useState(false); const [noteText, setNoteText] = useState(''); const [savingNote, setSavingNote] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null); const [form, setForm] = useState<ContactForm>({ ...emptyForm, tags: [] }); const [tagInput, setTagInput] = useState(''); const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([]); const [importRows, setImportRows] = useState<ContactForm[]>([]); const [importFileName, setImportFileName] = useState(''); const [importing, setImporting] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => { try { const saved = JSON.parse(localStorage.getItem('crm:contacts:columns') || 'null'); return Array.isArray(saved) && saved.length ? saved : defaultColumns } catch { return defaultColumns } })

  useEffect(() => { app.set({ ...(app.get() || {}), app: 'kuepa', module: 'crm', window: 'contact', back: null, accent: 'purple', breadcrumb: [{ title: 'Contactos', url: '/contacts' }] }) }, [])
  useEffect(() => { localStorage.setItem('crm:contacts:columns', JSON.stringify(visibleColumns)) }, [visibleColumns])
  useEffect(() => {
    void Promise.all([leadService.programs(), leadService.assignees()]).then(([programResponse, assigneeResponse]) => {
      if (programResponse?.code === 200) setPrograms(programResponse.list || [])
      if (assigneeResponse?.code === 200) setAssignees(assigneeResponse.list || [])
    })
  }, [])

  const loadContacts = async (targetPage = page, showLoading = true) => {
    if (showLoading) setLoading(true)
    const response = await thirdService.list({ type: 'cli', page: String(targetPage), limit: String(pageSize), ...(search.trim() ? { filters: search.trim() } : {}), ...buildFilterParams(filters) })
    if (response?.code === 200) { setContacts(response.list || []); setAvailableTags(response.tags || []); setTotal(response.pagination?.total || 0); setPages(response.pagination?.pages || 1); setPage(response.pagination?.page || targetPage); setNotice('') }
    else setNotice('No fue posible cargar los contactos')
    if (showLoading) setLoading(false)
  }
  useEffect(() => { const timer = window.setTimeout(() => void loadContacts(1), 250); return () => window.clearTimeout(timer) }, [search, filters, pageSize])
  useEffect(() => { if (page > pages) setPage(pages) }, [page, pages])
  useEffect(() => {
    if (!showFilters && !showColumnMenu) return
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      // Los desplegables de Radix se montan en un portal fuera del menú: ignoramos
      // esos clics para no cerrar el menú (ni perder el filtro) al elegir una opción.
      if (target.closest?.('.crm-select-content, [data-radix-popper-content-wrapper], [role="listbox"]')) return
      if (showFilters && filterRef.current && !filterRef.current.contains(target)) setShowFilters(false)
      if (showColumnMenu && columnRef.current && !columnRef.current.contains(target)) setShowColumnMenu(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showFilters, showColumnMenu])

  const activeFilterCount = countActiveFilters(filters)
  const hasFilters = activeFilterCount > 0
  const pageIds = contacts.map(contact => contact._id)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id))
  const gridTemplate = `42px minmax(250px, 1.5fr) ${visibleColumns.map(column => column === 'tags' ? 'minmax(150px, 1.1fr)' : column === 'document' || column === 'program' ? 'minmax(190px, 1.2fr)' : 'minmax(145px, 1fr)').join(' ')}`
  const openCreate = () => { setEditingContact(null); setForm({ ...emptyForm, tags: [] }); setTagInput(''); setFieldErrors({}); setNotice(''); setShowModal(true) }
  const openEdit = (contact: Contact) => { setEditingContact(contact); setForm({ first_name: contact.first_name || '', last_name: contact.last_name || '', email: contact.email || '', number: contact.number || '', document_type: contact.document_type || 'cc', document: contact.document || '', responsible: idOf(contact.responsible), origin: contact.origin || '', interestProgram: idOf(contact.interestProgram), tags: contact.tags || [] }); setTagInput(''); setFieldErrors({}); setNotice(''); setShowModal(true) }
  const openDetail = async (contact: Contact) => { setShowDetail(contact); setShowActionMenu(false); setShowNoteComposer(false); setNoteText(''); const response = await thirdService.get(contact._id); if (response?.code === 200 && response.third) setShowDetail(response.third) }
  const closeModal = () => { if (!saving) { setShowModal(false); setFieldErrors({}) } }
  const updateForm = (field: keyof ContactForm, value: string | string[]) => { setForm(current => ({ ...current, [field]: value })); setFieldErrors(current => { const next = { ...current }; delete next[field]; return next }) }
  const addTag = () => { if (!tagInput.trim()) return; updateForm('tags', normalizeTags([...form.tags, tagInput])); setTagInput('') }
  const toggleSelected = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const toggleAll = () => setSelectedIds(current => allPageSelected ? current.filter(id => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])])

  const updateFilter = (field: keyof ContactFilters, value: string) => { setFilters(current => ({ ...current, [field]: value })); setPage(1) }
  const toggleFilterTag = (tag: string) => { setFilters(current => ({ ...current, tags: current.tags.includes(tag) ? current.tags.filter(item => item !== tag) : [...current.tags, tag] })); setPage(1) }
  const clearFilters = () => { setFilters({ ...emptyFilters, tags: [] }); setPage(1) }
  const updateFilterRange = (value: { from: string; to: string }) => { setFilters(current => ({ ...current, created_from: value.from, created_to: value.to })); setPage(1) }

  const activeFilterChips: Array<{ key: string; label: string; onClear: () => void }> = []
  if (filters.interestProgram) activeFilterChips.push({ key: 'interestProgram', label: `🎓 ${programs.find(program => program._id === filters.interestProgram)?.name || 'Programa'}`, onClear: () => updateFilter('interestProgram', '') })
  if (filters.responsible) activeFilterChips.push({ key: 'responsible', label: `👤 ${relatedLabel(assignees.find(person => person._id === filters.responsible) || null) || 'Responsable'}`, onClear: () => updateFilter('responsible', '') })
  if (filters.origin) activeFilterChips.push({ key: 'origin', label: `🌐 ${originLabel(filters.origin)}`, onClear: () => updateFilter('origin', '') })
  if (filters.lead_status) activeFilterChips.push({ key: 'lead_status', label: `📌 ${filters.lead_status === 'active' ? 'Activo' : 'Inactivo'}`, onClear: () => updateFilter('lead_status', '') })
  if (filters.created_from) activeFilterChips.push({ key: 'created_from', label: `🗓️ Desde ${filters.created_from}`, onClear: () => updateFilter('created_from', '') })
  if (filters.created_to) activeFilterChips.push({ key: 'created_to', label: `🗓️ Hasta ${filters.created_to}`, onClear: () => updateFilter('created_to', '') })
  filters.tags.forEach(tag => activeFilterChips.push({ key: `tag-${tag}`, label: `🏷️ ${tag}`, onClear: () => toggleFilterTag(tag) }))

  const submitContact = async (event: FormEvent) => {
    event.preventDefault(); const errors = validateContactForm(form); if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setSaving(true)
    const payload: ContactPayload = { ...(editingContact?._id ? { _id: editingContact._id } : {}), first_name: form.first_name, last_name: form.last_name, email: form.email, number: form.number, document_type: form.document_type, document: form.document, tags: normalizeTags(form.tags), type: 'cli', status: editingContact?.status || 'active', ...(form.responsible ? { responsible: form.responsible } : {}), ...(form.origin ? { origin: form.origin } : {}), ...(form.interestProgram ? { interestProgram: form.interestProgram } : {}) }
    const response = await thirdService.upsert(payload)
    if (response?.code === 200) { setShowModal(false); toast({ title: editingContact ? 'Contacto actualizado' : 'Contacto creado', description: 'La información se guardó correctamente.', className: 'crm-success-toast' }); void loadContacts(page, false) }
    else if (response?.errors) setFieldErrors(response.errors)
    else setNotice(responseMessage(response))
    setSaving(false)
  }
  const saveNote = async () => {
    if (!showDetail || !noteText.trim()) return
    setSavingNote(true); const response = await thirdService.addNote({ _id: showDetail._id, text: noteText.trim() })
    if (response?.code === 200 && response.object) { setShowDetail(response.object); setContacts(current => current.map(contact => contact._id === showDetail._id ? response.object : contact)); setNoteText(''); setShowNoteComposer(false); toast({ title: 'Nota agregada', description: 'La nota quedó guardada en el contacto.', className: 'crm-success-toast' }) }
    else setNotice(responseMessage(response))
    setSavingNote(false)
  }
  const deleteContact = async (contact: Contact) => {
    if (!window.confirm(`¿Eliminar el contacto ${contactName(contact)}? Esta acción no se puede deshacer.`)) return
    const response = await thirdService.delete(contact._id)
    if (response?.code === 200) {
      setShowDetail(current => current?._id === contact._id ? null : current)
      setSelectedIds(current => current.filter(id => id !== contact._id))
      toast({ title: 'Contacto eliminado', description: 'El contacto se eliminó correctamente.', className: 'crm-success-toast' })
      void loadContacts(page, false)
    } else setNotice(responseMessage(response))
  }
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setImportFileName(file.name); setImportRows(csvContactRows(await file.text())) }
  const importContacts = async () => {
    setImporting(true); let imported = 0; const errors: string[] = []
    for (let index = 0; index < importRows.length; index += 1) { const row = importRows[index]; const validation = validateContactForm(row); if (Object.keys(validation).length) { errors.push(`Fila ${index + 2}: revisa los datos`); continue }; const response = await thirdService.upsert({ ...row, tags: normalizeTags(row.tags), type: 'cli', status: 'active' }); if (response?.code === 200) imported += 1; else errors.push(`Fila ${index + 2}: no se pudo guardar`) }
    await loadContacts(1, false); setImporting(false); if (!errors.length) { setShowImport(false); toast({ title: 'Importación completada', description: `${imported} contactos importados.`, className: 'crm-success-toast' }) } else setNotice(`${imported} importados; ${errors.length} filas requieren revisión.`)
  }

  const renderColumn = (contact: Contact, column: ColumnKey) => {
    if (column === 'phone') return <span className="crm-contact-table-value" role="cell">{contact.number || 'Sin teléfono'}</span>
    if (column === 'email') return <span className="crm-contact-table-value" role="cell">{contact.email || 'Sin correo'}</span>
    if (column === 'document') return <span className="crm-contact-table-value" role="cell">{documentTypeLabel(contact.document_type)} · {contact.document || 'Sin documento'}</span>
    if (column === 'program') return <span className="crm-contact-table-value" role="cell">{relatedLabel(contact.interestProgram) || 'Sin programa'}</span>
    if (column === 'responsible') return <span className="crm-contact-table-value" role="cell">{relatedLabel(contact.responsible) || 'Sin responsable'}</span>
    if (column === 'origin') return <span className="crm-contact-table-value" role="cell">{originLabel(contact.origin)}</span>
    if (column === 'tags') return <span className="crm-contact-table-tags" role="cell">{contact.tags?.length ? contact.tags.slice(0, 3).map(tag => <em key={tag}>{tag}</em>) : <small>Sin etiquetas</small>}</span>
    return <span className="crm-contact-table-date" role="cell">{relativeDate(contact.created_at)}</span>
  }

  return <main className="crm-page"><section className="crm-content">
    <div className="crm-heading"><div><h1>👥 Contactos</h1><p>Consulta toda la información comercial, agrega notas y organiza tu base.</p></div><div className="crm-heading-actions"><div className="crm-help-stack"><HelpTooltip title="Importar contactos" description="Sube un archivo CSV con tus contactos y sus datos personales y comerciales." /><button className="crm-secondary-button" onClick={() => setShowImport(true)}>📥 Importar</button></div><div className="crm-help-stack"><HelpTooltip title="Nuevo contacto" description="Registra manualmente un contacto con su información personal y comercial." /><button className="crm-primary-button" onClick={openCreate}>➕ Nuevo contacto</button></div></div></div>
    {notice && <div className="crm-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}
    <div className="crm-toolbar"><div className="crm-search"><span aria-hidden="true">🔎</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nombre, correo, teléfono, documento, programa o etiqueta..." aria-label="Buscar contactos" />{search && <button onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={14} /></button>}</div><div className="crm-filter-control" ref={filterRef}><div className="crm-help-stack"><HelpTooltip title="Filtros" description="Abre el menú para filtrar por programa, responsable, origen, estado, etiquetas y fecha." /><button type="button" className={`crm-filter-button crm-icon-button ${hasFilters ? 'is-active' : ''}`} onClick={() => setShowFilters(current => !current)} aria-label="Filtros">🌪️{activeFilterCount > 0 && <span className="crm-filter-count">{activeFilterCount}</span>}</button></div>{showFilters && <div className="crm-filter-menu" role="dialog" aria-label="Filtros de contactos"><div className="crm-filter-menu-head"><strong>🌪️ Filtros</strong>{hasFilters && <button type="button" onClick={clearFilters}>Limpiar</button>}</div><div className="crm-filter-grid"><label className="crm-filter-field"><span>🎓 Programa</span><DesignSelect value={filters.interestProgram} onChange={value => updateFilter('interestProgram', value)} placeholder="Todos los programas" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label><label className="crm-filter-field"><span>👤 Responsable</span><DesignSelect value={filters.responsible} onChange={value => updateFilter('responsible', value)} placeholder="Todos los responsables" options={assignees.map(person => ({ value: person._id, label: relatedLabel(person) || 'Sin nombre' }))} /></label><label className="crm-filter-field"><span>🌐 Origen</span><DesignSelect value={filters.origin} onChange={value => updateFilter('origin', value)} placeholder="Todos los orígenes" options={origins} /></label><label className="crm-filter-field"><span>📌 Estado</span><DesignSelect value={filters.lead_status} onChange={value => updateFilter('lead_status', value)} placeholder="Todos los estados" options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} /></label></div><div className="crm-filter-field"><span>🗓️ Fecha de creación</span><CrmDateRange from={filters.created_from} to={filters.created_to} onChange={updateFilterRange} /></div><div className="crm-filter-field"><span>🏷️ Etiquetas</span><div className="crm-filter-tags">{availableTags.length ? availableTags.map(tag => <button type="button" key={tag} className={`crm-filter-tag ${filters.tags.includes(tag) ? 'is-active' : ''}`} onClick={() => toggleFilterTag(tag)}>{tag}</button>) : <small className="crm-filter-empty">Aún no hay etiquetas</small>}</div></div><div className="crm-filter-menu-foot"><span>{total} {total === 1 ? 'contacto' : 'contactos'}</span><button type="button" className="crm-primary-button" onClick={() => setShowFilters(false)}>Ver resultados</button></div></div>}</div><div className="crm-help-stack"><HelpTooltip title="Columnas visibles" description="Elige qué columnas mostrar en la tabla. Tu selección se guarda automáticamente." /><div className="crm-column-control" ref={columnRef}><button type="button" className="crm-secondary-button crm-icon-button" onClick={() => setShowColumnMenu(current => !current)} aria-label="Columnas visibles">🧩</button>{showColumnMenu && <div className="crm-column-menu"><strong>Columnas visibles</strong>{columnOptions.map(option => <label key={option.key}><input type="checkbox" checked={visibleColumns.includes(option.key)} onChange={() => setVisibleColumns(current => current.includes(option.key) ? current.length > 1 ? current.filter(column => column !== option.key) : current : [...current, option.key])} />{option.emoji} {option.label}</label>)}</div>}</div></div>{selectedIds.length > 0 && <button className="crm-clear-button" onClick={() => setSelectedIds([])}>✕ {selectedIds.length} seleccionados</button>}<span className="crm-contact-count">{total} contactos</span></div>
    {hasFilters && <div className="crm-active-filters" aria-label="Filtros activos">{activeFilterChips.map(chip => <button type="button" key={chip.key} className="crm-active-filter" onClick={chip.onClear}>{chip.label}<span aria-hidden="true">✕</span></button>)}<button type="button" className="crm-active-filters-clear" onClick={clearFilters}>Limpiar todo</button></div>}
    {loading ? <div className="crm-empty-state">⏳ Cargando contactos...</div> : !contacts.length ? <div className="crm-empty-state"><span className="crm-empty-emoji" aria-hidden="true">👥</span><h2>{search || hasFilters ? 'No encontramos contactos' : 'Aún no hay contactos'}</h2><p>{search || hasFilters ? 'Prueba con otros criterios.' : 'Crea o importa contactos para comenzar.'}</p>{!search && !hasFilters && <button className="crm-primary-button" onClick={openCreate}>➕ Crear primer contacto</button>}</div> : <><div className="crm-contact-table-shell"><div className="crm-contact-table" role="table" aria-label="Listado de contactos"><div className="crm-contact-table-header" role="row" style={{ gridTemplateColumns: gridTemplate }}><span role="columnheader"><input type="checkbox" aria-label="Seleccionar todos los contactos de esta página" checked={allPageSelected} onChange={toggleAll} /></span><span role="columnheader">Contacto</span>{visibleColumns.map(column => <span role="columnheader" key={column}>{columnOptions.find(option => option.key === column)?.emoji} {columnOptions.find(option => option.key === column)?.label}</span>)}</div>{contacts.map(contact => <article className="crm-contact-table-row" key={contact._id} role="row" tabIndex={0} style={{ gridTemplateColumns: gridTemplate }} onClick={() => void openDetail(contact)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openDetail(contact) } }}><div role="cell" className="crm-contact-select"><input type="checkbox" aria-label={`Seleccionar ${contactName(contact)}`} checked={selectedIds.includes(contact._id)} onChange={() => toggleSelected(contact._id)} onClick={event => event.stopPropagation()} /></div><div className="crm-contact-table-person" role="cell"><div className="crm-contact-avatar">{initialsOf(contact)}</div><div><strong>{contactName(contact)}</strong></div></div>{visibleColumns.map(column => <React.Fragment key={column}>{renderColumn(contact, column)}</React.Fragment>)}</article>)}</div></div><div className="crm-pagination"><label className="crm-pagination-size">Mostrar<DesignSelect className="crm-select-compact" value={String(pageSize)} onChange={value => setPageSize(Number(value))} placeholder="25" options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} /> contactos</label><span>{Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} de {total}</span><div><button disabled={page <= 1} onClick={() => { setPage(current => current - 1); void loadContacts(page - 1) }}>‹ Anterior</button><strong>Página {page} de {pages}</strong><button disabled={page >= pages} onClick={() => { setPage(current => current + 1); void loadContacts(page + 1) }}>Siguiente ›</button></div></div></>}
  </section>

  {showDetail && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => setShowDetail(null)}><section className="crm-modal crm-detail-modal" role="dialog" aria-modal="true" aria-labelledby="contact-detail-title" onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">👤 Perfil del contacto</span><h2 id="contact-detail-title">{contactName(showDetail)}</h2><p>Información completa de la persona registrada.</p></div><div className="crm-contact-actions"><button type="button" className="crm-secondary-button" onClick={() => setShowActionMenu(current => !current)}>⋮ Acciones</button>{showActionMenu && <div className="crm-contact-actions-menu"><button type="button" onClick={() => { setShowNoteComposer(true); setShowActionMenu(false) }}>📝 Agregar nota</button><button type="button" onClick={() => { setShowDetail(null); openEdit(showDetail) }}>✏️ Editar contacto</button><button type="button" className="crm-danger-action" onClick={() => { setShowActionMenu(false); void deleteContact(showDetail) }}>🗑️ Eliminar contacto</button></div>}<button type="button" onClick={() => setShowDetail(null)} aria-label="Cerrar"><X size={17} /></button></div></div><div className="crm-detail-hero"><div className="crm-detail-avatar">{initialsOf(showDetail)}</div><div><strong>{contactName(showDetail)}</strong><span>{showDetail.tags?.length || 0} etiquetas · creado {relativeDate(showDetail.created_at)}</span></div></div><div className="crm-detail-grid"><div className="crm-detail-item"><span>📞 Teléfono</span><strong>{showDetail.number || 'Sin teléfono'}</strong></div><div className="crm-detail-item"><span>✉️ Correo electrónico</span><strong>{showDetail.email || 'Sin correo'}</strong></div><div className="crm-detail-item"><span>🪪 Documento</span><strong>{documentTypeLabel(showDetail.document_type)} · {showDetail.document || 'Sin documento'}</strong></div><div className="crm-detail-item"><span>🎓 Programa</span><strong>{relatedLabel(showDetail.interestProgram) || 'Sin programa'}</strong></div><div className="crm-detail-item"><span>👤 Responsable</span><strong>{relatedLabel(showDetail.responsible) || 'Sin responsable'}</strong></div><div className="crm-detail-item"><span>🌐 Origen</span><strong>{originLabel(showDetail.origin)}</strong></div><div className="crm-detail-item"><span>🗓️ Creado</span><strong>{fullDate(showDetail.created_at)}</strong></div></div>{showNoteComposer && <div className="crm-note-composer"><h3>📝 Nueva nota</h3><textarea value={noteText} maxLength={2000} onChange={event => setNoteText(event.target.value)} placeholder="Escribe una nota sobre este contacto..." autoFocus /><div><small>{noteText.length}/2000</small><button type="button" className="crm-secondary-button" onClick={() => setShowNoteComposer(false)}>Cancelar</button><button type="button" className="crm-primary-button" disabled={!noteText.trim() || savingNote} onClick={() => void saveNote()}>{savingNote ? 'Guardando...' : 'Guardar nota'}</button></div></div>}{showDetail.tags?.length ? <div className="crm-detail-extra"><h3>🏷️ Etiquetas</h3>{showDetail.tags.map(tag => <span key={tag}>🏷️ {tag}</span>)}</div> : null}<div className="crm-notes-list"><h3>📝 Notas ({showDetail.notes?.length || 0})</h3>{showDetail.notes?.length ? [...showDetail.notes].reverse().map((note, index) => <article key={note._id || `${note.created_at}-${index}`}><p>{note.text}</p><small>{fullDate(note.created_at)}{relatedLabel(note.user) ? ` · ${relatedLabel(note.user)}` : ''}</small></article>) : <p className="crm-notes-empty">Este contacto todavía no tiene notas.</p>}</div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowDetail(null)}>Cerrar</button><button type="button" className="crm-primary-button" onClick={() => { setShowDetail(null); openEdit(showDetail) }}>✏️ Editar contacto</button></div></section></div></ModalPortal>}

  {showModal && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={closeModal}><form className="crm-modal crm-contact-modal" onSubmit={submitContact} onMouseDown={event => event.stopPropagation()} noValidate><div className="crm-modal-header"><div><span className="crm-modal-kicker">👥 Directorio comercial</span><h2>{editingContact ? 'Editar contacto' : 'Nuevo contacto'}</h2><p>Información personal y comercial del contacto.</p></div><button type="button" onClick={closeModal} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-form-grid"><label className={fieldErrors.first_name ? 'crm-invalid-field' : ''}><span>Nombre <b>*</b></span><input autoFocus value={form.first_name} onChange={event => updateForm('first_name', event.target.value)} /><FieldError message={fieldErrors.first_name} /></label><label className={fieldErrors.last_name ? 'crm-invalid-field' : ''}><span>Apellido <b>*</b></span><input value={form.last_name} onChange={event => updateForm('last_name', event.target.value)} /><FieldError message={fieldErrors.last_name} /></label><label className={fieldErrors.email ? 'crm-invalid-field' : ''}><span>✉️ Correo</span><input type="email" value={form.email} onChange={event => updateForm('email', event.target.value)} /><FieldError message={fieldErrors.email} /></label><label className={fieldErrors.number ? 'crm-invalid-field' : ''}><span>📞 Teléfono <b>*</b></span><input inputMode="numeric" maxLength={10} value={form.number} onChange={event => updateForm('number', event.target.value.replace(/\D/g, '').slice(0, 10))} /><FieldError message={fieldErrors.number} /></label><label className={fieldErrors.document_type ? 'crm-invalid-field' : ''}><span>Tipo de documento <b>*</b></span><DesignSelect value={form.document_type} invalid={Boolean(fieldErrors.document_type)} onChange={value => updateForm('document_type', value)} placeholder="Tipo de documento" options={documentTypes} /><FieldError message={fieldErrors.document_type} /></label><label className={fieldErrors.document ? 'crm-invalid-field' : ''}><span>🪪 Documento <b>*</b></span><input inputMode="numeric" maxLength={20} value={form.document} onChange={event => updateForm('document', event.target.value.replace(/\D/g, '').slice(0, 20))} /><FieldError message={fieldErrors.document} /></label><label><span>🎓 Programa</span><DesignSelect value={form.interestProgram} onChange={value => updateForm('interestProgram', value)} placeholder="Sin programa" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label><label><span>👤 Responsable</span><DesignSelect value={form.responsible} onChange={value => updateForm('responsible', value)} placeholder="Sin responsable" options={assignees.map(person => ({ value: person._id, label: `${person.profile?.first_name || ''} ${person.profile?.last_name || ''}`.trim() || person.username || 'Sin nombre' }))} /></label><label><span>🌐 Origen</span><DesignSelect value={form.origin} onChange={value => updateForm('origin', value)} placeholder="Sin origen" options={origins} /></label><div className="crm-form-full"><span className="crm-field-label">🏷️ Etiquetas</span><div className="crm-tag-input"><input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} placeholder="Escribe una etiqueta y presiona Enter" /><button type="button" onClick={addTag}>➕</button></div><div className="crm-selected-tags">{form.tags.map(tag => <button type="button" key={tag} onClick={() => updateForm('tags', form.tags.filter(item => item !== tag))}>🏷️ {tag} ✕</button>)}</div></div></div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={closeModal}>Cancelar</button><button type="submit" className="crm-primary-button" disabled={saving}>{saving ? 'Guardando...' : editingContact ? 'Guardar cambios' : 'Crear contacto'}</button></div></form></div></ModalPortal>}

  {showImport && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => !importing && setShowImport(false)}><section className="crm-modal crm-import-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">📥 Importación</span><h2>Importar contactos</h2><p>Sube un CSV con datos personales y comerciales. Puedes usar IDs para programa y responsable.</p></div><button type="button" onClick={() => !importing && setShowImport(false)} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-import-content"><label className="crm-import-dropzone"><input type="file" accept=".csv,text/csv" onChange={event => void handleImportFile(event)} />📄 <strong>{importFileName || 'Seleccionar archivo CSV'}</strong><small>Encabezados: first_name, last_name, email, phone, document, program, responsible, origin, tags.</small></label>{importRows.length > 0 && <div className="crm-import-preview"><strong>🔎 Vista previa: {importRows.length} contactos</strong>{importRows.slice(0, 4).map((row, index) => <span key={`preview-${index}`}>{contactName(row)} · {row.number || 'Sin teléfono'}{row.interestProgram ? ` · ${row.interestProgram}` : ''}</span>)}</div>}</div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowImport(false)} disabled={importing}>Cancelar</button><button type="button" className="crm-primary-button" onClick={() => void importContacts()} disabled={importing || !importRows.length}>{importing ? 'Importando...' : '📥 Importar contactos'}</button></div></section></div></ModalPortal>}
  </main>
}
