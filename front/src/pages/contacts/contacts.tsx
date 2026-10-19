import { app } from '@/atoms/kuepa'
import { useToast } from '@/components/hooks/use-toast'
import { leadService } from '@/services/leadService'
import { thirdService } from '@/services/thirdService'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { DesignSelect } from '@/components/ui/design-select'
import { CrmDateRange } from '@/components/ui/crm-date-range'
import {
  Assignee,
  Contact,
  ContactForm,
  ModalPortal,
  Program,
  Related,
  avatarTone,
  birthdateLabel,
  contactName,
  departmentOptions,
  documentTypeLabel,
  documentTypes,
  educationLevelLabel,
  educationLevels,
  idOf,
  initialsOf,
  matchDepartment,
  matchEducationLevel,
  matchOption,
  normalizeTags,
  normalizeText,
  originLabel,
  origins,
  parseBirthdate,
  relatedLabel,
  relativeDate,
  todayIso,
  validateContactForm,
} from './contact-shared'
import ContactFormModal from './contact-form-modal'

type ColumnKey = 'phone' | 'email' | 'documentType' | 'documentNumber' | 'birthdate' | 'city' | 'department' | 'educationLevel' | 'program' | 'responsible' | 'origin' | 'tags' | 'created'

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
  department: string
  educationLevel: string
  tags: string[]
  created_from: string
  created_to: string
}

const columnOptions: Array<{ key: ColumnKey; label: string; emoji: string }> = [
  { key: 'phone', label: 'Teléfono', emoji: '📞' },
  { key: 'email', label: 'Correo', emoji: '✉️' },
  { key: 'documentType', label: 'Tipo de documento', emoji: '🪪' },
  { key: 'documentNumber', label: 'Número de documento', emoji: '🔢' },
  { key: 'birthdate', label: 'Fecha de nacimiento', emoji: '🎂' },
  { key: 'city', label: 'Ciudad', emoji: '🏙️' },
  { key: 'department', label: 'Departamento', emoji: '🗺️' },
  { key: 'educationLevel', label: 'Nivel de escolaridad', emoji: '📚' },
  { key: 'program', label: 'Programa', emoji: '🎓' },
  { key: 'responsible', label: 'Responsable', emoji: '👤' },
  { key: 'origin', label: 'Origen', emoji: '🌐' },
  { key: 'tags', label: 'Etiquetas', emoji: '🏷️' },
  { key: 'created', label: 'Fecha de creación', emoji: '🗓️' },
]
const defaultColumns: ColumnKey[] = ['phone', 'documentNumber', 'program', 'tags', 'created']
/** La antigua columna "document" (tipo + número) ahora son dos columnas separadas. */
const migrateColumns = (saved: unknown): ColumnKey[] => {
  if (!Array.isArray(saved)) return defaultColumns
  const migrated = [...new Set(saved
    .map(key => key === 'document' ? 'documentNumber' : key)
    .filter(key => columnOptions.some(option => option.key === key)))] as ColumnKey[]
  return migrated.length ? migrated : defaultColumns
}
const emptyFilters: ContactFilters = {
  first_name: '', last_name: '', email: '', number: '', document: '', document_type: '', origin: '',
  interestProgram: '', responsible: '', lead_status: '', department: '', educationLevel: '',
  tags: [], created_from: '', created_to: '',
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
      document_type: matchOption(read(row, ['documenttype', 'tipodedocumento']), documentTypes) || 'cc', document: read(row, ['document', 'documento', 'documentnumber', 'numerodedocumento']),
      birthdate: parseBirthdate(read(row, ['birthdate', 'fechanacimiento', 'fechanac', 'nacimiento', 'birthday', 'fechanacimientonacimiento'])),
      city: read(row, ['city', 'ciudad', 'municipio']),
      department: matchDepartment(read(row, ['department', 'departamento', 'estado'])),
      educationLevel: matchEducationLevel(read(row, ['educationlevel', 'niveldeescolaridad', 'escolaridad', 'nivel'])),
      responsible: read(row, ['responsible', 'responsable']), origin: matchOption(read(row, ['origin', 'origen']), origins), interestProgram: read(row, ['interestprogram', 'program', 'programa']),
      tags: normalizeTags(read(row, ['tags', 'etiquetas']).split(/[|;]/)),
    }
  }).filter(row => Object.values(row).some(value => Array.isArray(value) ? value.length > 0 : Boolean(value)))
}

const exportHeaders = ['first_name', 'last_name', 'email', 'phone', 'document_type', 'document', 'birthdate', 'city', 'department', 'education_level', 'program', 'responsible', 'origin', 'tags', 'created_at']

const csvCell = (value: unknown): string => {
  const text = value === undefined || value === null ? '' : String(value)
  return /["\n\r,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Etiqueta legible cuando el valor existe (el importador acepta código o etiqueta). */
const rawOrLabel = (value: string | undefined, label: (item?: string) => string): string => value ? label(value) : ''

const contactCsvRow = (contact: Contact): string[] => [
  contact.first_name || '',
  contact.last_name || '',
  contact.email || '',
  contact.number || '',
  rawOrLabel(contact.document_type, documentTypeLabel),
  contact.document || '',
  contact.birthdate || '',
  contact.city || '',
  contact.department || '',
  rawOrLabel(contact.educationLevel, educationLevelLabel),
  relatedLabel(contact.interestProgram) || '',
  relatedLabel(contact.responsible) || '',
  rawOrLabel(contact.origin, originLabel),
  (contact.tags || []).join('|'),
  contact.created_at || '',
]

const contactsToCsv = (contacts: Contact[]): string => [
  exportHeaders.join(','),
  ...contacts.map(contact => contactCsvRow(contact).map(csvCell).join(',')),
].join('\r\n')

const downloadCsv = (filename: string, content: string) => {
  // El BOM hace que Excel respete las tildes y la ñ.
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** CSV de ejemplo con lo mínimo que necesita el importador. */
const exampleCsv = [
  'first_name,last_name,phone,document_type,document',
  'Ana,Gómez,3001234567,cc,1020304050',
  'Carlos,Pérez,3109876543,ti,1098765432',
].join('\r\n')

export default function Contacts () {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(''); const [notice, setNotice] = useState('')
  const [filters, setFilters] = useState<ContactFilters>({ ...emptyFilters, tags: [] }); const [availableTags, setAvailableTags] = useState<string[]>([])
  const filterRef = useRef<HTMLDivElement>(null); const columnRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(25); const [total, setTotal] = useState(0); const [pages, setPages] = useState(1)
  const [showModal, setShowModal] = useState(false); const [showImport, setShowImport] = useState(false)
  const [showFilters, setShowFilters] = useState(false); const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([]); const [importRows, setImportRows] = useState<ContactForm[]>([]); const [importFileName, setImportFileName] = useState(''); const [importing, setImporting] = useState(false); const [exporting, setExporting] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => { try { return migrateColumns(JSON.parse(localStorage.getItem('crm:contacts:columns') || 'null')) } catch { return defaultColumns } })

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
  const gridTemplate = `42px minmax(250px, 1.5fr) ${visibleColumns.map(column => column === 'tags' ? 'minmax(150px, 1.1fr)' : column === 'documentType' || column === 'documentNumber' || column === 'birthdate' || column === 'department' || column === 'educationLevel' || column === 'program' ? 'minmax(190px, 1.2fr)' : 'minmax(145px, 1fr)').join(' ')}`
  const openCreate = () => { setNotice(''); setShowModal(true) }
  const openDetail = (contact: Contact) => { void navigate(`/contacts/${contact._id}`) }
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
  if (filters.department) activeFilterChips.push({ key: 'department', label: `🗺️ ${filters.department}`, onClear: () => updateFilter('department', '') })
  if (filters.educationLevel) activeFilterChips.push({ key: 'educationLevel', label: `📚 ${educationLevelLabel(filters.educationLevel)}`, onClear: () => updateFilter('educationLevel', '') })
  if (filters.created_from) activeFilterChips.push({ key: 'created_from', label: `🗓️ Desde ${filters.created_from}`, onClear: () => updateFilter('created_from', '') })
  if (filters.created_to) activeFilterChips.push({ key: 'created_to', label: `🗓️ Hasta ${filters.created_to}`, onClear: () => updateFilter('created_to', '') })
  filters.tags.forEach(tag => activeFilterChips.push({ key: `tag-${tag}`, label: `🏷️ ${tag}`, onClear: () => toggleFilterTag(tag) }))

  /** Acepta el nombre del programa o del responsable y lo convierte en su id. */
  const resolveReference = (value: string, options: Related[]): string => {
    const raw = value.trim(); if (!raw) return ''
    if (/^[a-f\d]{24}$/i.test(raw)) return raw
    const key = normalizeText(raw)
    const match = options.find(option => normalizeText(relatedLabel(option)) === key)
    return match ? idOf(match) : ''
  }
  const withResolvedReferences = (rows: ContactForm[]): ContactForm[] => rows.map(row => ({ ...row, interestProgram: resolveReference(row.interestProgram, programs), responsible: resolveReference(row.responsible, assignees) }))

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; setImportFileName(file.name); setImportRows(withResolvedReferences(csvContactRows(await file.text()))) }

  const exportContacts = async () => {
    setExporting(true)
    const params: Record<string, string> = { type: 'cli', ...(search.trim() ? { filters: search.trim() } : {}), ...buildFilterParams(filters) }
    if (selectedIds.length) {
      const selected = contacts.filter(contact => selectedIds.includes(contact._id))
      const missing = selectedIds.filter(id => !contacts.some(contact => contact._id === id))
      const fetched = await Promise.all(missing.map(id => thirdService.get(id)))
      const rows: Contact[] = [...selected, ...fetched.map(response => response?.third).filter(Boolean) as Contact[]]
      downloadCsv(`contactos-seleccionados-${todayIso()}.csv`, contactsToCsv(rows))
      toast({ title: 'Exportación lista', description: `${rows.length} ${rows.length === 1 ? 'contacto exportado' : 'contactos exportados'}.`, className: 'crm-success-toast' })
      setExporting(false); return
    }
    const first = await thirdService.list({ ...params, page: '1', limit: '100' })
    let rows: Contact[] = first?.code === 200 ? (first.list || []) : []
    const totalPages = Math.max(1, Math.ceil((first?.pagination?.total || 0) / 100))
    for (let target = 2; target <= totalPages; target += 1) { const next = await thirdService.list({ ...params, page: String(target), limit: '100' }); if (next?.code === 200) rows = [...rows, ...(next.list || [])] }
    if (!rows.length) { setNotice('No hay contactos para exportar'); setExporting(false); return }
    downloadCsv(`contactos-${todayIso()}.csv`, contactsToCsv(rows))
    toast({ title: 'Exportación lista', description: `${rows.length} contactos exportados.`, className: 'crm-success-toast' })
    setExporting(false)
  }
  const importContacts = async () => {
    setImporting(true); let imported = 0; const errors: string[] = []
    for (let index = 0; index < importRows.length; index += 1) { const row = importRows[index]; const validation = validateContactForm(row); if (Object.keys(validation).length) { errors.push(`Fila ${index + 2}: revisa los datos`); continue }; const response = await thirdService.upsert({ ...row, tags: normalizeTags(row.tags), type: 'cli', status: 'active' }); if (response?.code === 200) imported += 1; else errors.push(`Fila ${index + 2}: no se pudo guardar`) }
    await loadContacts(1, false); setImporting(false); if (!errors.length) { setShowImport(false); toast({ title: 'Importación completada', description: `${imported} contactos importados.`, className: 'crm-success-toast' }) } else setNotice(`${imported} importados; ${errors.length} filas requieren revisión.`)
  }

  const renderColumn = (contact: Contact, column: ColumnKey) => {
    if (column === 'phone') return <span className="crm-contact-table-value" role="cell">{contact.number || 'Sin teléfono'}</span>
    if (column === 'email') return <span className="crm-contact-table-value" role="cell">{contact.email || 'Sin correo'}</span>
    if (column === 'documentType') return <span className="crm-contact-table-value" role="cell">{documentTypeLabel(contact.document_type)}</span>
    if (column === 'documentNumber') return <span className="crm-contact-table-value" role="cell">{contact.document || 'Sin documento'}</span>
    if (column === 'birthdate') return <span className="crm-contact-table-value" role="cell">{contact.birthdate ? birthdateLabel(contact.birthdate) : 'Sin fecha'}</span>
    if (column === 'city') return <span className="crm-contact-table-value" role="cell">{contact.city || 'Sin ciudad'}</span>
    if (column === 'department') return <span className="crm-contact-table-value" role="cell">{contact.department || 'Sin departamento'}</span>
    if (column === 'educationLevel') return <span className="crm-contact-table-value" role="cell">{contact.educationLevel ? educationLevelLabel(contact.educationLevel) : 'Sin nivel'}</span>
    if (column === 'program') return <span className="crm-contact-table-value" role="cell">{relatedLabel(contact.interestProgram) || 'Sin programa'}</span>
    if (column === 'responsible') return <span className="crm-contact-table-value" role="cell">{relatedLabel(contact.responsible) || 'Sin responsable'}</span>
    if (column === 'origin') return <span className="crm-contact-table-value" role="cell">{originLabel(contact.origin)}</span>
    if (column === 'tags') return <span className="crm-contact-table-tags" role="cell">{contact.tags?.length ? contact.tags.slice(0, 3).map(tag => <em key={tag}>{tag}</em>) : <small>Sin etiquetas</small>}</span>
    return <span className="crm-contact-table-date" role="cell">{relativeDate(contact.created_at)}</span>
  }

  return <main className="crm-page"><section className="crm-content">
    <div className="crm-heading"><div><h1>👥 Contactos</h1><p>Consulta toda la información comercial, agrega notas y organiza tu base.</p></div><div className="crm-heading-actions"><HelpTooltip title="Nuevo contacto" description="Registra manualmente un contacto con su información personal y comercial."><button className="crm-primary-button" onClick={openCreate}>➕ Nuevo contacto</button></HelpTooltip></div></div>
    {notice && <div className="crm-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}
    <div className="crm-toolbar"><div className="crm-search"><span aria-hidden="true">🔎</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar nombre, correo, teléfono, documento, programa o etiqueta..." aria-label="Buscar contactos" />{search && <button onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={14} /></button>}</div><HelpTooltip title="Importar contactos" description="Sube un archivo CSV con tus contactos. En el aviso de importación tienes un ejemplo descargable."><button type="button" className="crm-secondary-button" onClick={() => setShowImport(true)}>📥 Importar</button></HelpTooltip><HelpTooltip title="Exportar contactos" description={selectedIds.length ? `Descarga un CSV con los ${selectedIds.length} contactos que seleccionaste.` : 'Descarga un CSV con todos los contactos que coinciden con la búsqueda y los filtros actuales.'}><button type="button" className="crm-secondary-button" onClick={() => void exportContacts()} disabled={exporting}>{exporting ? '⏳ Exportando...' : '📤 Exportar'}</button></HelpTooltip><div className="crm-filter-control" ref={filterRef}><HelpTooltip title="Filtros" description="Abre el menú para filtrar por programa, responsable, origen, estado, etiquetas y fecha."><button type="button" className={`crm-filter-button ${hasFilters ? 'is-active' : ''}`} onClick={() => setShowFilters(current => !current)}>🌪️ Filtros{activeFilterCount > 0 && <span className="crm-filter-count">{activeFilterCount}</span>}</button></HelpTooltip>{showFilters && <div className="crm-filter-menu" role="dialog" aria-label="Filtros de contactos"><div className="crm-filter-menu-head"><strong>🌪️ Filtros</strong>{hasFilters && <button type="button" onClick={clearFilters}>Limpiar</button>}</div><div className="crm-filter-grid"><label className="crm-filter-field"><span>🎓 Programa</span><DesignSelect value={filters.interestProgram} onChange={value => updateFilter('interestProgram', value)} placeholder="Todos los programas" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label><label className="crm-filter-field"><span>👤 Responsable</span><DesignSelect value={filters.responsible} onChange={value => updateFilter('responsible', value)} placeholder="Todos los responsables" options={assignees.map(person => ({ value: person._id, label: relatedLabel(person) || 'Sin nombre' }))} /></label><label className="crm-filter-field"><span>🌐 Origen</span><DesignSelect value={filters.origin} onChange={value => updateFilter('origin', value)} placeholder="Todos los orígenes" options={origins} /></label><label className="crm-filter-field"><span>📌 Estado</span><DesignSelect value={filters.lead_status} onChange={value => updateFilter('lead_status', value)} placeholder="Todos los estados" options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} /></label><label className="crm-filter-field"><span>🗺️ Departamento</span><DesignSelect value={filters.department} onChange={value => updateFilter('department', value)} placeholder="Todos los departamentos" options={departmentOptions} /></label><label className="crm-filter-field"><span>📚 Nivel de escolaridad</span><DesignSelect value={filters.educationLevel} onChange={value => updateFilter('educationLevel', value)} placeholder="Todos los niveles" options={educationLevels} /></label></div><div className="crm-filter-field"><span>🗓️ Fecha de creación</span><CrmDateRange from={filters.created_from} to={filters.created_to} onChange={updateFilterRange} /></div><div className="crm-filter-field"><span>🏷️ Etiquetas</span><div className="crm-filter-tags">{availableTags.length ? availableTags.map(tag => <button type="button" key={tag} className={`crm-filter-tag ${filters.tags.includes(tag) ? 'is-active' : ''}`} onClick={() => toggleFilterTag(tag)}>{tag}</button>) : <small className="crm-filter-empty">Aún no hay etiquetas</small>}</div></div><div className="crm-filter-menu-foot"><span>{total} {total === 1 ? 'contacto' : 'contactos'}</span><button type="button" className="crm-primary-button" onClick={() => setShowFilters(false)}>Ver resultados</button></div></div>}</div><div className="crm-column-control" ref={columnRef}><HelpTooltip title="Columnas visibles" description="Elige qué columnas mostrar en la tabla. Tu selección se guarda automáticamente."><button type="button" className="crm-secondary-button" onClick={() => setShowColumnMenu(current => !current)}>🧩 Columnas</button></HelpTooltip>{showColumnMenu && <div className="crm-column-menu"><strong>Columnas visibles</strong>{columnOptions.map(option => <label key={option.key}><input type="checkbox" checked={visibleColumns.includes(option.key)} onChange={() => setVisibleColumns(current => current.includes(option.key) ? current.length > 1 ? current.filter(column => column !== option.key) : current : [...current, option.key])} />{option.emoji} {option.label}</label>)}</div>}</div>{selectedIds.length > 0 && <button className="crm-clear-button" onClick={() => setSelectedIds([])}>✕ {selectedIds.length} seleccionados</button>}<span className="crm-contact-count">{total} contactos</span></div>
    {hasFilters && <div className="crm-active-filters" aria-label="Filtros activos">{activeFilterChips.map(chip => <button type="button" key={chip.key} className="crm-active-filter" onClick={chip.onClear}>{chip.label}<span aria-hidden="true">✕</span></button>)}<button type="button" className="crm-active-filters-clear" onClick={clearFilters}>Limpiar todo</button></div>}
     {loading ? <div className="crm-empty-state">⏳ Cargando contactos...</div> : !contacts.length ? <div className="crm-empty-state"><span className="crm-empty-emoji" aria-hidden="true">👥</span><h2>{search || hasFilters ? 'No encontramos contactos' : 'Aún no hay contactos'}</h2><p>{search || hasFilters ? 'Prueba con otros criterios.' : 'Crea o importa contactos para comenzar.'}</p>{!search && !hasFilters && <button className="crm-primary-button" onClick={openCreate}>➕ Crear primer contacto</button>}</div> : <><div className="crm-contact-table-shell"><div className="crm-contact-table" role="table" aria-label="Listado de contactos"><div className="crm-contact-table-header" role="row" style={{ gridTemplateColumns: gridTemplate }}><span role="columnheader"><input type="checkbox" aria-label="Seleccionar todos los contactos de esta página" checked={allPageSelected} onChange={toggleAll} /></span><span role="columnheader">Contacto</span>{visibleColumns.map(column => <span role="columnheader" key={column}>{columnOptions.find(option => option.key === column)?.emoji} {columnOptions.find(option => option.key === column)?.label}</span>)}</div>{contacts.map(contact => <article className="crm-contact-table-row" key={contact._id} role="row" tabIndex={0} style={{ gridTemplateColumns: gridTemplate }} onClick={() => void openDetail(contact)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void openDetail(contact) } }}><div role="cell" className="crm-contact-select"><input type="checkbox" aria-label={`Seleccionar ${contactName(contact)}`} checked={selectedIds.includes(contact._id)} onChange={() => toggleSelected(contact._id)} onClick={event => event.stopPropagation()} /></div><div className="crm-contact-table-person" role="cell"><div className="crm-contact-avatar" style={{ background: avatarTone(contact._id).soft, color: avatarTone(contact._id).strong }}>{initialsOf(contact)}</div><div><strong>{contactName(contact)}</strong></div></div>{visibleColumns.map(column => <React.Fragment key={column}>{renderColumn(contact, column)}</React.Fragment>)}</article>)}</div></div><div className="crm-pagination"><label className="crm-pagination-size">Mostrar<DesignSelect className="crm-select-compact" value={String(pageSize)} onChange={value => setPageSize(Number(value))} placeholder="25" options={[{ value: '10', label: '10' }, { value: '25', label: '25' }, { value: '50', label: '50' }, { value: '100', label: '100' }]} /> contactos</label><div><button disabled={page <= 1} onClick={() => { setPage(current => current - 1); void loadContacts(page - 1) }}>‹ Anterior</button><strong>Página {page} de {pages}</strong><button disabled={page >= pages} onClick={() => { setPage(current => current + 1); void loadContacts(page + 1) }}>Siguiente ›</button></div></div></>}
  </section>

  {showModal && <ContactFormModal programs={programs} assignees={assignees} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); void loadContacts(page, false) }} />}
  {showImport && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => !importing && setShowImport(false)}><section className="crm-modal crm-import-modal" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">📥 Importación</span><h2>Importar contactos</h2><p>Sube un CSV con los datos de tus contactos. Puedes escribir el nombre del programa y del responsable.</p></div><button type="button" onClick={() => !importing && setShowImport(false)} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-import-content"><label className="crm-import-dropzone"><input type="file" accept=".csv,text/csv" onChange={event => void handleImportFile(event)} />📄 <strong>{importFileName || 'Seleccionar archivo CSV'}</strong><small>Obligatorios: nombre, apellido, teléfono y número de documento.</small></label><div className="crm-import-example"><button type="button" className="crm-secondary-button" onClick={() => downloadCsv('ejemplo-contactos.csv', exampleCsv)}>⬇️ Descargar ejemplo</button></div>{importRows.length > 0 && <div className="crm-import-preview"><strong>🔎 Vista previa: {importRows.length} contactos</strong>{importRows.slice(0, 4).map((row, index) => <span key={`preview-${index}`}>{contactName(row)} · {row.number || 'Sin teléfono'}{row.interestProgram ? ` · ${programs.find(item => item._id === row.interestProgram)?.name || 'Programa'}` : ''}</span>)}</div>}</div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowImport(false)} disabled={importing}>Cancelar</button><button type="button" className="crm-primary-button" onClick={() => void importContacts()} disabled={importing || !importRows.length}>{importing ? 'Importando...' : '📥 Importar contactos'}</button></div></section></div></ModalPortal>}
  </main>
}
