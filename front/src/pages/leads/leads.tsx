import { app, access, user } from '@/atoms/kuepa'
import { leadService } from '@/services/leadService'
import { useToast } from '@/components/hooks/use-toast'
import { useStore } from '@nanostores/react'
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Archive,
  GripVertical,
  LayoutGrid,
  ListFilter,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Tag,
  Target,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Stage = {
  _id: string
  name: string
  key?: string
  color: string
  order: number
  status: 'active' | 'archived'
}

type Program = {
  _id: string
  name: string
  description?: string
}

type Assignee = {
  _id: string
  username?: string
  profile?: {
    first_name?: string
    last_name?: string
    avatar?: string
  }
}

type Lead = {
  _id: string
  first_name?: string
  last_name?: string
  full_name?: string
  email?: string
  mobile_phone?: string
  document_type?: string
  document?: string
  origin?: string
  tags?: string[]
  created_at?: string
  stage?: Stage | string | null
  responsible?: Assignee | string | null
  interestProgram?: Program | string | null
  contact?: {
    first_name?: string
    last_name?: string
  } | null
}

type LeadForm = {
  first_name: string
  last_name: string
  email: string
  mobile_phone: string
  document_type: string
  document: string
  responsible: string
  origin: string
  interestProgram: string
  stage: string
  tags: string[]
}

const origins = [
  { value: 'website', label: 'Sitio web' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referido' },
  { value: 'other', label: 'Otro' },
]

const documentTypes = [
  { value: 'cc', label: 'Cédula de ciudadanía' },
  { value: 'ti', label: 'Tarjeta de identidad' },
  { value: 'pp', label: 'Pasaporte' },
  { value: 'nt', label: 'NIT' },
]

const emptyForm: LeadForm = {
  first_name: '',
  last_name: '',
  email: '',
  mobile_phone: '',
  document_type: 'cc',
  document: '',
  responsible: '',
  origin: 'website',
  interestProgram: '',
  stage: '',
  tags: [],
}

const idOf = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && '_id' in value) return String(value._id)
  return ''
}

const nameOf = (value: unknown): string => {
  if (value && typeof value === 'object') {
    const item = value as { name?: string; profile?: Assignee['profile'] }
    if (item.name) return item.name
    if (item.profile) return `${item.profile.first_name || ''} ${item.profile.last_name || ''}`.trim()
  }
  return ''
}

const initialsOf = (lead: Lead): string => {
  const name = leadNameOf(lead)
  return name.split(' ').map(part => part[0] || '').join('').slice(0, 2).toUpperCase()
}

const leadNameOf = (lead: Lead): string => {
  const ownName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
  const contactName = `${lead.contact?.first_name || ''} ${lead.contact?.last_name || ''}`.trim()
  return ownName || contactName || lead.full_name || 'Lead sin nombre'
}

const originLabel = (origin?: string): string => {
  return origins.find(item => item.value === origin)?.label || origin || 'Sin origen'
}

const relativeDate = (date?: string): string => {
  if (!date) return 'Sin fecha'
  const difference = Date.now() - new Date(date).getTime()
  const hours = Math.max(0, Math.floor(difference / 3_600_000))
  if (hours < 1) return 'ahora'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} d`
}

const errorMessage = (response: any): string => {
  if (response?.errors && typeof response.errors === 'object') {
    return Object.values(response.errors).join('. ')
  }
  return response?.message || 'No fue posible completar la operación'
}

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

type LeadFieldErrors = Partial<Record<keyof LeadForm, string>>

const validateLeadForm = (value: LeadForm): LeadFieldErrors => {
  const errors: LeadFieldErrors = {}
  const namePattern = /^[\p{L}\s'-]+$/u
  const phone = value.mobile_phone.trim()
  const document = value.document.trim()

  if (!value.first_name.trim()) errors.first_name = 'El nombre es obligatorio'
  else if (value.first_name.trim().length < 2) errors.first_name = 'El nombre debe tener al menos 2 caracteres'
  else if (!namePattern.test(value.first_name.trim())) errors.first_name = 'El nombre solo puede contener letras y espacios'
  if (!value.last_name.trim()) errors.last_name = 'El apellido es obligatorio'
  else if (value.last_name.trim().length < 2) errors.last_name = 'El apellido debe tener al menos 2 caracteres'
  else if (!namePattern.test(value.last_name.trim())) errors.last_name = 'El apellido solo puede contener letras y espacios'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.email.trim())) errors.email = 'Ingresa un correo electrónico válido'
  if (!phone) errors.mobile_phone = 'El teléfono es obligatorio'
  else if (!/^\d+$/.test(phone)) errors.mobile_phone = 'El teléfono solo puede contener números'
  else if (phone.length !== 10) errors.mobile_phone = 'El teléfono debe tener exactamente 10 dígitos'
  if (!value.document_type) errors.document_type = 'Selecciona un tipo de documento'
  if (!document) errors.document = 'El documento es obligatorio'
  else if (!/^\d+$/.test(document)) errors.document = 'El documento solo puede contener números'
  else if (document.length < 4 || document.length > 20) errors.document = 'El documento debe tener entre 4 y 20 dígitos'
  if (!value.responsible) errors.responsible = 'Selecciona un responsable'
  if (!value.origin) errors.origin = 'Selecciona un origen'
  if (!value.interestProgram) errors.interestProgram = 'Selecciona un programa'
  if (!value.stage) errors.stage = 'Selecciona una etapa'

  return errors
}

function FieldError ({ message }: { message?: string }) {
  return message ? <small className="crm-field-error" role="alert">{message}</small> : null
}

type DesignSelectProps = {
  value: string
  placeholder: string
  options: Array<{ value: string, label: string }>
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
}

function DesignSelect ({ value, placeholder, options, onChange, disabled = false, invalid = false }: DesignSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`crm-select-trigger ${invalid ? 'crm-select-invalid' : ''}`} aria-label={placeholder} aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="crm-select-content">
        {options.map(option => <SelectItem className="crm-select-item" key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function ModalPortal ({ children }: { children: ReactNode }) {
  return createPortal(children, document.body)
}

export default function Leads () {
  const $access = useStore(access) as any
  const $user = useStore(user) as any
  const { toast } = useToast()
  const [stages, setStages] = useState<Stage[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedOrigin, setSelectedOrigin] = useState('')
  const [selectedResponsible, setSelectedResponsible] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showNewLead, setShowNewLead] = useState(false)
  const [showNewStage, setShowNewStage] = useState(false)
  const [activeView, setActiveView] = useState<'board' | 'stages'>('board')
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('#7224b5')
  const [draggedLead, setDraggedLead] = useState<string | null>(null)
  const [draggedStage, setDraggedStage] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState<LeadForm>(emptyForm)
  const [notice, setNotice] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({})
  const loadSequence = useRef(0)

  const homePermissions = ($user?.homes || [])
    .filter((home: any) => home.app === 'kuepa')
    .flatMap((home: any) => [
      ...(Array.isArray(home.can) ? home.can : []),
      ...(Array.isArray(home.permissions) ? home.permissions : []),
      ...(Array.isArray(home.roles) ? home.roles.flatMap((role: any) => role.permissions || []) : []),
    ])
    .map((permission: any) => typeof permission === 'string' ? permission : permission?.content)

  const availablePermissions = [
    ...($access?.can || []),
    ...homePermissions,
  ]

  const canManageStages = availablePermissions.includes('all') || availablePermissions.includes('crm:lead-stages:manage')

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
       module: 'crm',
       window: 'lead',
      back: null,
      accent: 'purple',
      breadcrumb: [{ title: 'Leads', url: '/leads' }],
    })
  }, [])

  const loadData = async (leadToKeep?: Lead, attempt = 0) => {
    const currentSequence = ++loadSequence.current
    setLoading(true)
    const [stageResponse, leadResponse, programResponse, assigneeResponse] = await Promise.all([
      leadService.stages(),
      leadService.list(),
      leadService.programs(),
      leadService.assignees(),
    ])

    if (currentSequence !== loadSequence.current) return

    const responses = [stageResponse, leadResponse, programResponse, assigneeResponse]
    const dataUnavailable = responses.some(response => response?.code !== 200)
    if (dataUnavailable && attempt < 6) {
      await wait(500 * (attempt + 1))
      return loadData(leadToKeep, attempt + 1)
    }

    if (stageResponse?.code === 200) setStages((stageResponse.list || []).sort((a: Stage, b: Stage) => a.order - b.order))
    if (leadResponse?.code === 200) {
      const nextLeads = [...(leadResponse.list || [])]
      if (leadToKeep?._id && !nextLeads.some(lead => lead._id === leadToKeep._id)) nextLeads.unshift(leadToKeep)
      setLeads(nextLeads)
    }
    if (programResponse?.code === 200) setPrograms(programResponse.list || [])
    if (assigneeResponse?.code === 200) setAssignees(assigneeResponse.list || [])
    if (responses.some(response => response?.status === 'error')) {
      setNotice('No fue posible cargar todos los datos del CRM')
    }
    setLoading(false)
  }

  const loadLeads = async (leadToKeep?: Lead) => {
    const response = await leadService.list()
    if (response?.code !== 200) return

    const nextLeads = [...(response.list || [])]
    if (leadToKeep?._id && !nextLeads.some(lead => lead._id === leadToKeep._id)) nextLeads.unshift(leadToKeep)
    setLeads(nextLeads)
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const refreshOnFocus = () => void loadLeads()
    window.addEventListener('focus', refreshOnFocus)
    return () => window.removeEventListener('focus', refreshOnFocus)
  }, [])

  useEffect(() => {
    if (!form.stage && stages[0]) setForm(current => ({ ...current, stage: stages[0]._id }))
  }, [stages, form.stage])

  useEffect(() => {
    const modal = document.querySelector('.crm-lead-modal') as HTMLFormElement | null
    if (modal) modal.noValidate = true
    if (!showNewLead) {
      setFieldErrors({})
    }
  }, [showNewLead])

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leads.filter(lead => {
      const content = `${leadNameOf(lead)} ${lead.email || ''} ${lead.document || ''} ${originLabel(lead.origin)} ${(lead.tags || []).join(' ')}`.toLowerCase()
      return (!query || content.includes(query)) &&
        (!selectedOrigin || lead.origin === selectedOrigin) &&
        (!selectedResponsible || idOf(lead.responsible) === selectedResponsible)
    })
  }, [leads, search, selectedOrigin, selectedResponsible])

  const leadCount = visibleLeads.length

  const updateForm = (field: keyof LeadForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
    setFieldErrors(current => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const addTag = (value: string) => {
    const tag = value.trim()
    if (!tag || form.tags.includes(tag)) return
    setForm(current => ({ ...current, tags: [...current.tags, tag] }))
    setTagInput('')
  }

  const submitLead = async (event: FormEvent) => {
    event.preventDefault()
    const validationErrors = validateLeadForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setSaving(true)
    setNotice('')
    const response = await leadService.create(form)
    if (response?.code === 200) {
      const createdLead = response.object as Lead
      setForm(emptyForm)
      setTagInput('')
      setFieldErrors({})
      setShowNewLead(false)
      toast({
        title: 'Lead creado',
        description: 'El lead se creó correctamente.',
        className: 'crm-success-toast',
      })
      if (createdLead?._id) setLeads(current => [createdLead, ...current.filter(lead => lead._id !== createdLead._id)])
      void loadLeads(createdLead)
    } else {
      setFieldErrors(response?.errors || {})
    }
    setSaving(false)
  }

  const moveLead = async (stageId: string) => {
    if (!draggedLead) return
    if (stageId === '__unassigned__') {
      setDraggedLead(null)
      return
    }
    const currentLead = leads.find(lead => lead._id === draggedLead)
    if (!currentLead || idOf(currentLead.stage) === stageId) {
      setDraggedLead(null)
      return
    }
    setSaving(true)
    const response = await leadService.move({ _id: draggedLead, stage: stageId })
    setDraggedLead(null)
    if (response?.code === 200) await loadData()
    else setNotice(errorMessage(response))
    setSaving(false)
  }

  const createStage = async (event: FormEvent) => {
    event.preventDefault()
    if (!newStageName.trim()) return
    setSaving(true)
    const response = await leadService.saveStage({
      name: newStageName,
      color: newStageColor,
      order: stages.length + 1,
    })
    if (response?.code === 200) {
      setNewStageName('')
      setNewStageColor('#7224b5')
      setShowNewStage(false)
      await loadData()
    } else setNotice(errorMessage(response))
    setSaving(false)
  }

  const saveStage = async (stage: Stage, changes: Partial<Stage>) => {
    const nextStage = { ...stage, ...changes }
    setStages(current => current.map(item => item._id === stage._id ? nextStage : item))
    const response = await leadService.saveStage({
      _id: stage._id,
      name: nextStage.name,
      color: nextStage.color,
      order: nextStage.order,
    })
    if (response?.code !== 200) setNotice(errorMessage(response))
  }

  const reorderStages = async (targetId: string) => {
    if (!draggedStage || draggedStage === targetId) return
    const from = stages.findIndex(stage => stage._id === draggedStage)
    const to = stages.findIndex(stage => stage._id === targetId)
    if (from < 0 || to < 0) return
    const next = [...stages]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const ordered = next.map((stage, index) => ({ ...stage, order: index + 1 }))
    setStages(ordered)
    setDraggedStage(null)
    await Promise.all(ordered.map(stage => leadService.saveStage({
      _id: stage._id,
      name: stage.name,
      color: stage.color,
      order: stage.order,
    })))
  }

  const archiveStage = async (stage: Stage) => {
    if (!window.confirm(`¿Archivar la etapa ${stage.name}?`)) return
    const response = await leadService.archiveStage(stage._id)
    if (response?.code === 200) await loadData()
    else setNotice(errorMessage(response))
  }

  const filteredStages = [
    ...(visibleLeads.some(lead => !idOf(lead.stage)) ? [{
      _id: '__unassigned__',
      name: 'Sin etapa',
      color: '#8b8192',
      order: 0,
      status: 'active' as const,
      leads: visibleLeads.filter(lead => !idOf(lead.stage)),
    }] : []),
    ...stages.map(stage => ({
      ...stage,
      leads: visibleLeads.filter(lead => idOf(lead.stage) === stage._id),
    })),
  ]

  return (
    <main className="crm-page">
      <section className="crm-content">
        <div className="crm-heading">
          <div><div className="crm-eyebrow"><Target size={14} /> Pipeline comercial</div><h1>Leads</h1><p>Gestiona tus oportunidades y lleva cada conversación al siguiente nivel.</p></div>
          <div className="crm-heading-actions">
            {canManageStages && <button className="crm-secondary-button" onClick={() => setActiveView('stages')}><Settings2 size={15} /> Configurar etapas</button>}
            <button className="crm-primary-button" onClick={() => setShowNewLead(true)}><Plus size={16} /> Crear lead</button>
          </div>
        </div>

        {notice && <div className="crm-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}

        <div className="crm-toolbar">
          <div className="crm-search"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nombre, documento..." aria-label="Buscar leads" />{search && <button onClick={() => setSearch('')} aria-label="Limpiar búsqueda"><X size={14} /></button>}</div>
          <button className={`crm-filter-button ${showFilters ? 'is-active' : ''}`} onClick={() => setShowFilters(current => !current)}><span className="crm-filter-emoji" aria-hidden="true">🌪️</span> Filtros{(selectedOrigin || selectedResponsible) && <span className="crm-filter-count">{Number(Boolean(selectedOrigin)) + Number(Boolean(selectedResponsible))}</span>}</button>
          <div className="crm-view-toggle"><button className="selected" aria-label="Vista kanban"><LayoutGrid size={16} /></button><button aria-label="Vista de lista" disabled><ListFilter size={16} /></button></div>
        </div>

        {showFilters && <div className="crm-filter-panel"><label>Responsable<DesignSelect value={selectedResponsible} onChange={setSelectedResponsible} placeholder="Todos los responsables" options={assignees.map(item => ({ value: item._id, label: nameOf(item) || item.username || 'Sin nombre' }))} /></label><label>Origen<DesignSelect value={selectedOrigin} onChange={setSelectedOrigin} placeholder="Todos los orígenes" options={origins} /></label><button className="crm-clear-button" onClick={() => { setSelectedOrigin(''); setSelectedResponsible('') }}>Limpiar filtros</button></div>}

        {activeView === 'stages' && canManageStages ? <section className="crm-stage-settings"><div className="crm-settings-heading"><div><div className="crm-eyebrow"><Settings2 size={14} /> Configuración del pipeline</div><h2>Ordena y personaliza tus etapas</h2><p>Define el recorrido comercial y el color de cada etapa.</p></div><button className="crm-secondary-button" onClick={() => setActiveView('board')}><LayoutGrid size={15} /> Volver al kanban</button></div><div className="crm-stage-list">{stages.map((stage, index) => <article className="crm-stage-row" key={stage._id} draggable onDragStart={() => setDraggedStage(stage._id)} onDragOver={event => event.preventDefault()} onDrop={() => void reorderStages(stage._id)}><GripVertical className="crm-drag-handle" size={17} /><span className="crm-stage-order">{index + 1}</span><span className="crm-stage-dot large" style={{ background: stage.color }} /><input value={stage.name} onChange={event => setStages(current => current.map(item => item._id === stage._id ? { ...item, name: event.target.value } : item))} onBlur={() => void saveStage(stage, { name: stages.find(item => item._id === stage._id)?.name || stage.name })} aria-label={`Nombre de ${stage.name}`} /><span className="crm-stage-leads">{visibleLeads.filter(lead => idOf(lead.stage) === stage._id).length} leads</span><label className="crm-color-control" title="Cambiar color"><input type="color" value={stage.color} onChange={event => void saveStage(stage, { color: event.target.value })} aria-label={`Color de ${stage.name}`} /><span style={{ background: stage.color }} /></label><button className="crm-row-action" onClick={() => void archiveStage(stage)} aria-label={`Archivar ${stage.name}`}><Archive size={16} /></button></article>)}</div><button className="crm-add-stage" onClick={() => setShowNewStage(true)}><Plus size={15} /> Añadir nueva etapa</button></section> : <>
          <div className="crm-board-toolbar"><div><span className="crm-live-dot" /> Pipeline general <span className="crm-board-count">{leadCount} leads</span></div><span className="crm-board-status">{loading ? 'Cargando...' : 'Actualizado'}</span></div>
          {loading ? <div className="crm-empty-state">Cargando leads...</div> : stages.length === 0 ? <div className="crm-empty-state"><span className="crm-empty-emoji" aria-hidden="true">🗂️</span><h2>Aún no hay etapas</h2><p>Un administrador debe crear la primera etapa para comenzar a gestionar leads.</p>{canManageStages && <button className="crm-primary-button" onClick={() => setShowNewStage(true)}><Plus size={15} /> Crear primera etapa</button>}</div> : <div className="crm-board">{filteredStages.map(stage => <section className="crm-column" key={stage._id} onDragOver={event => event.preventDefault()} onDrop={() => void moveLead(stage._id)}><div className="crm-column-header"><div><span className="crm-stage-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong><span className="crm-stage-count">{stage.leads.length}</span></div><button aria-label={`Opciones de ${stage.name}`}><MoreHorizontal size={17} /></button></div><div className="crm-column-body">{stage.leads.map(lead => <article className="crm-lead-card" key={lead._id} draggable onDragStart={() => setDraggedLead(lead._id)}><div className="crm-card-top"><span className="crm-lead-origin">{originLabel(lead.origin)}</span><button aria-label={`Opciones de ${lead.first_name}`}><MoreHorizontal size={16} /></button></div><h3>{lead.first_name} {lead.last_name}</h3><p className="crm-lead-detail">{lead.interestProgram ? nameOf(lead.interestProgram) : 'Programa sin asignar'}</p><div className="crm-card-tags">{(lead.tags || []).slice(0, 3).map(tag => <span key={tag}><Tag size={10} />{tag}</span>)}</div><div className="crm-card-bottom"><div className="crm-owner"><span className="crm-avatar">{initialsOf(lead)}</span><span>{nameOf(lead.responsible) || nameOf(assignees.find(item => item._id === idOf(lead.responsible))) || 'Sin responsable'}</span></div><span className="crm-age">{relativeDate(lead.created_at)}</span></div></article>)}{stage.leads.length === 0 && <div className="crm-empty-column">No hay leads aquí</div>}<button className="crm-add-card" onClick={() => { setForm(current => ({ ...current, stage: stage._id })); setShowNewLead(true) }}><Plus size={14} /> Añadir lead</button></div></section>)}{canManageStages && <button className="crm-new-column" onClick={() => setShowNewStage(true)}><Plus size={14} /> Añadir etapa</button>}</div>}
        </>}
      </section>

      {showNewLead && (
        <ModalPortal>
          <div className="crm-modal-backdrop" onMouseDown={() => setShowNewLead(false)}>
            <form className="crm-modal crm-lead-modal" onSubmit={submitLead} onMouseDown={event => event.stopPropagation()}>
              <div className="crm-modal-header">
                <div><span className="crm-modal-kicker">Nueva oportunidad</span><h2>Crear lead</h2><p>Registra un contacto y ubícalo en su etapa del embudo.</p></div>
                <button type="button" onClick={() => setShowNewLead(false)} aria-label="Cerrar"><X size={17} /></button>
              </div>
              <div className="crm-form-grid">
                <label className={fieldErrors.first_name ? 'crm-invalid-field' : ''}><span>Nombre <b>*</b></span><input value={form.first_name} aria-invalid={Boolean(fieldErrors.first_name)} onChange={event => updateForm('first_name', event.target.value)} /><FieldError message={fieldErrors.first_name} /></label>
                <label className={fieldErrors.last_name ? 'crm-invalid-field' : ''}><span>Apellido <b>*</b></span><input value={form.last_name} aria-invalid={Boolean(fieldErrors.last_name)} onChange={event => updateForm('last_name', event.target.value)} /><FieldError message={fieldErrors.last_name} /></label>
                <label className={fieldErrors.email ? 'crm-invalid-field' : ''}><span><Mail size={14} /> Correo <b>*</b></span><input type="email" value={form.email} aria-invalid={Boolean(fieldErrors.email)} onChange={event => updateForm('email', event.target.value)} /><FieldError message={fieldErrors.email} /></label>
                <label className={fieldErrors.mobile_phone ? 'crm-invalid-field' : ''}><span>Teléfono <b>*</b></span><input inputMode="numeric" maxLength={10} value={form.mobile_phone} aria-invalid={Boolean(fieldErrors.mobile_phone)} onChange={event => updateForm('mobile_phone', event.target.value.replace(/[^0-9]/g, '').slice(0, 10))} /><FieldError message={fieldErrors.mobile_phone} /></label>
                <label className={fieldErrors.document_type ? 'crm-invalid-field' : ''}><span>Tipo de documento <b>*</b></span><DesignSelect value={form.document_type} invalid={Boolean(fieldErrors.document_type)} onChange={value => updateForm('document_type', value)} placeholder="Tipo de documento" options={documentTypes} /><FieldError message={fieldErrors.document_type} /></label>
                <label className={fieldErrors.document ? 'crm-invalid-field' : ''}><span>Documento <b>*</b></span><input inputMode="numeric" maxLength={20} value={form.document} aria-invalid={Boolean(fieldErrors.document)} onChange={event => updateForm('document', event.target.value.replace(/[^0-9]/g, '').slice(0, 20))} /><FieldError message={fieldErrors.document} /></label>
                <label className={fieldErrors.responsible ? 'crm-invalid-field' : ''}><span><Users size={14} /> Responsable <b>*</b></span><DesignSelect value={form.responsible} invalid={Boolean(fieldErrors.responsible)} onChange={value => updateForm('responsible', value)} placeholder="Selecciona un responsable" options={assignees.map(item => ({ value: item._id, label: nameOf(item) || item.username || 'Sin nombre' }))} /><FieldError message={fieldErrors.responsible} /></label>
                <label className={fieldErrors.origin ? 'crm-invalid-field' : ''}><span>Origen <b>*</b></span><DesignSelect value={form.origin} invalid={Boolean(fieldErrors.origin)} onChange={value => updateForm('origin', value)} placeholder="Selecciona un origen" options={origins} /><FieldError message={fieldErrors.origin} /></label>
                <label className={fieldErrors.interestProgram ? 'crm-invalid-field' : ''}><span>Programa <b>*</b></span><DesignSelect value={form.interestProgram} invalid={Boolean(fieldErrors.interestProgram)} onChange={value => updateForm('interestProgram', value)} placeholder="Selecciona un programa" options={programs.map(program => ({ value: program._id, label: program.name }))} /><FieldError message={fieldErrors.interestProgram} /></label>
                <label className={fieldErrors.stage ? 'crm-invalid-field' : ''}><span><Target size={14} /> Etapa <b>*</b></span><DesignSelect value={form.stage} invalid={Boolean(fieldErrors.stage)} onChange={value => updateForm('stage', value)} placeholder="Selecciona una etapa" options={stages.map(stage => ({ value: stage._id, label: stage.name }))} /><FieldError message={fieldErrors.stage} /></label>
                <div className="crm-form-full"><span className="crm-field-label"><Tag size={14} /> Etiquetas</span><div className="crm-tag-input"><input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(tagInput) } }} placeholder="Escribe una etiqueta y presiona Enter" /><button type="button" onClick={() => addTag(tagInput)}><Plus size={15} /></button></div><div className="crm-selected-tags">{form.tags.map(tag => <button type="button" key={tag} onClick={() => setForm(current => ({ ...current, tags: current.tags.filter(item => item !== tag) }))}>{tag}<X size={11} /></button>)}</div></div>
              </div>
              <div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowNewLead(false)}>Cancelar</button><button type="submit" className="crm-primary-button" disabled={saving}><UserPlus size={15} /> {saving ? 'Creando...' : 'Crear lead'}</button></div>
            </form>
          </div>
        </ModalPortal>
      )}

      {showNewStage && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => setShowNewStage(false)}><form className="crm-modal crm-small-modal" onSubmit={createStage} onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">Pipeline</span><h2>Nueva etapa</h2><p>Define un nuevo momento del proceso comercial.</p></div><button type="button" onClick={() => setShowNewStage(false)} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-form-stack"><label>Nombre de la etapa<input autoFocus required value={newStageName} onChange={event => setNewStageName(event.target.value)} placeholder="Ej. En seguimiento" /></label><label>Color<input type="color" value={newStageColor} onChange={event => setNewStageColor(event.target.value)} /></label></div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowNewStage(false)}>Cancelar</button><button type="submit" className="crm-primary-button" disabled={saving}><Plus size={15} /> Añadir etapa</button></div></form></div></ModalPortal>}
    </main>
  )
}
