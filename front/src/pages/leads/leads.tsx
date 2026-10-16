import { app, access } from '@/atoms/kuepa'
import { leadService } from '@/services/leadService'
import { useStore } from '@nanostores/react'
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
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
  first_name: string
  last_name: string
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
  return `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`.toUpperCase()
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

type DesignSelectProps = {
  value: string
  placeholder: string
  options: Array<{ value: string, label: string }>
  onChange: (value: string) => void
  disabled?: boolean
}

function DesignSelect ({ value, placeholder, options, onChange, disabled = false }: DesignSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="crm-select-trigger" aria-label={placeholder}>
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

  const canManageStages = Boolean(
    $access?.can?.includes?.('all') || $access?.can?.includes?.('crm:lead-stages:manage'),
  )

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'leads',
      window: 'crm',
      back: null,
      accent: 'purple',
      breadcrumb: [{ title: 'Leads', url: '/leads' }],
    })
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [stageResponse, leadResponse, programResponse, assigneeResponse] = await Promise.all([
      leadService.stages(),
      leadService.list(),
      leadService.programs(),
      leadService.assignees(),
    ])

    if (stageResponse?.code === 200) setStages((stageResponse.list || []).sort((a: Stage, b: Stage) => a.order - b.order))
    if (leadResponse?.code === 200) setLeads(leadResponse.list || [])
    if (programResponse?.code === 200) setPrograms(programResponse.list || [])
    if (assigneeResponse?.code === 200) setAssignees(assigneeResponse.list || [])
    if ([stageResponse, leadResponse, programResponse, assigneeResponse].some(response => response?.status === 'error')) {
      setNotice('No fue posible cargar todos los datos del CRM')
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!form.stage && stages[0]) setForm(current => ({ ...current, stage: stages[0]._id }))
  }, [stages, form.stage])

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase()
    return leads.filter(lead => {
      const content = `${lead.first_name} ${lead.last_name} ${lead.email || ''} ${lead.document || ''} ${originLabel(lead.origin)} ${(lead.tags || []).join(' ')}`.toLowerCase()
      return (!query || content.includes(query)) &&
        (!selectedOrigin || lead.origin === selectedOrigin) &&
        (!selectedResponsible || idOf(lead.responsible) === selectedResponsible)
    })
  }, [leads, search, selectedOrigin, selectedResponsible])

  const leadCount = visibleLeads.length

  const updateForm = (field: keyof LeadForm, value: string) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const addTag = (value: string) => {
    const tag = value.trim()
    if (!tag || form.tags.includes(tag)) return
    setForm(current => ({ ...current, tags: [...current.tags, tag] }))
    setTagInput('')
  }

  const submitLead = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    const response = await leadService.create(form)
    if (response?.code === 200) {
      setForm(emptyForm)
      setTagInput('')
      setShowNewLead(false)
      await loadData()
      setNotice('Lead creado correctamente')
    } else {
      setNotice(errorMessage(response))
    }
    setSaving(false)
  }

  const moveLead = async (stageId: string) => {
    if (!draggedLead) return
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

  const filteredStages = stages.map(stage => ({
    ...stage,
    leads: visibleLeads.filter(lead => idOf(lead.stage) === stage._id),
  }))

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
          {loading ? <div className="crm-empty-state">Cargando leads...</div> : stages.length === 0 ? <div className="crm-empty-state"><span className="crm-empty-emoji" aria-hidden="true">🗂️</span><h2>Aún no hay etapas</h2><p>Un administrador debe crear la primera etapa para comenzar a gestionar leads.</p>{canManageStages && <button className="crm-primary-button" onClick={() => setShowNewStage(true)}><Plus size={15} /> Crear primera etapa</button>}</div> : <div className="crm-board">{filteredStages.map(stage => <section className="crm-column" key={stage._id} onDragOver={event => event.preventDefault()} onDrop={() => void moveLead(stage._id)}><div className="crm-column-header"><div><span className="crm-stage-dot" style={{ background: stage.color }} /><strong>{stage.name}</strong><span className="crm-stage-count">{stage.leads.length}</span></div><button aria-label={`Opciones de ${stage.name}`}><MoreHorizontal size={17} /></button></div><div className="crm-column-body">{stage.leads.map(lead => <article className="crm-lead-card" key={lead._id} draggable onDragStart={() => setDraggedLead(lead._id)}><div className="crm-card-top"><span className="crm-lead-origin">{originLabel(lead.origin)}</span><button aria-label={`Opciones de ${lead.first_name}`}><MoreHorizontal size={16} /></button></div><h3>{lead.first_name} {lead.last_name}</h3><p className="crm-lead-detail">{lead.interestProgram ? nameOf(lead.interestProgram) : 'Programa sin asignar'}</p><div className="crm-card-tags">{(lead.tags || []).slice(0, 3).map(tag => <span key={tag}><Tag size={10} />{tag}</span>)}</div><div className="crm-card-bottom"><div className="crm-owner"><span className="crm-avatar">{initialsOf(lead)}</span><span>{nameOf(lead.responsible) || 'Sin responsable'}</span></div><span className="crm-age">{relativeDate(lead.created_at)}</span></div></article>)}{stage.leads.length === 0 && <div className="crm-empty-column">No hay leads aquí</div>}<button className="crm-add-card" onClick={() => { setForm(current => ({ ...current, stage: stage._id })); setShowNewLead(true) }}><Plus size={14} /> Añadir lead</button></div></section>)}{canManageStages && <button className="crm-new-column" onClick={() => setShowNewStage(true)}><Plus size={14} /> Añadir etapa</button>}</div>}
        </>}
      </section>

      {showNewLead && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => setShowNewLead(false)}><form className="crm-modal crm-lead-modal" onSubmit={submitLead} onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">Nueva oportunidad</span><h2>Crear lead</h2><p>Registra un contacto y ubícalo en su etapa del embudo.</p></div><button type="button" onClick={() => setShowNewLead(false)} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-form-grid"><label><span>Nombre <b>*</b></span><input required value={form.first_name} onChange={event => updateForm('first_name', event.target.value)} /></label><label><span>Apellido <b>*</b></span><input required value={form.last_name} onChange={event => updateForm('last_name', event.target.value)} /></label><label><span><Mail size={14} /> Correo <b>*</b></span><input required type="email" value={form.email} onChange={event => updateForm('email', event.target.value)} /></label><label><span>Teléfono <b>*</b></span><input required value={form.mobile_phone} onChange={event => updateForm('mobile_phone', event.target.value)} /></label><label><span>Tipo de documento <b>*</b></span><DesignSelect value={form.document_type} onChange={value => updateForm('document_type', value)} placeholder="Tipo de documento" options={documentTypes} /></label><label><span>Documento <b>*</b></span><input required value={form.document} onChange={event => updateForm('document', event.target.value)} /></label><label><span><Users size={14} /> Responsable <b>*</b></span><DesignSelect value={form.responsible} onChange={value => updateForm('responsible', value)} placeholder="Selecciona un responsable" options={assignees.map(item => ({ value: item._id, label: nameOf(item) || item.username || 'Sin nombre' }))} /></label><label><span>Origen <b>*</b></span><DesignSelect value={form.origin} onChange={value => updateForm('origin', value)} placeholder="Selecciona un origen" options={origins} /></label><label><span>Programa <b>*</b></span><DesignSelect value={form.interestProgram} onChange={value => updateForm('interestProgram', value)} placeholder="Selecciona un programa" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label><label><span><Target size={14} /> Etapa <b>*</b></span><DesignSelect value={form.stage} onChange={value => updateForm('stage', value)} placeholder="Selecciona una etapa" options={stages.map(stage => ({ value: stage._id, label: stage.name }))} /></label><div className="crm-form-full"><span className="crm-field-label"><Tag size={14} /> Etiquetas</span><div className="crm-tag-input"><input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag(tagInput) } }} placeholder="Escribe una etiqueta y presiona Enter" /><button type="button" onClick={() => addTag(tagInput)}><Plus size={15} /></button></div><div className="crm-selected-tags">{form.tags.map(tag => <button type="button" key={tag} onClick={() => setForm(current => ({ ...current, tags: current.tags.filter(item => item !== tag) }))}>{tag}<X size={11} /></button>)}</div></div></div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowNewLead(false)}>Cancelar</button><button type="submit" className="crm-primary-button" disabled={saving}><UserPlus size={15} /> {saving ? 'Creando...' : 'Crear lead'}</button></div></form></div></ModalPortal>}

      {showNewStage && <ModalPortal><div className="crm-modal-backdrop" onMouseDown={() => setShowNewStage(false)}><form className="crm-modal crm-small-modal" onSubmit={createStage} onMouseDown={event => event.stopPropagation()}><div className="crm-modal-header"><div><span className="crm-modal-kicker">Pipeline</span><h2>Nueva etapa</h2><p>Define un nuevo momento del proceso comercial.</p></div><button type="button" onClick={() => setShowNewStage(false)} aria-label="Cerrar"><X size={17} /></button></div><div className="crm-form-stack"><label>Nombre de la etapa<input autoFocus required value={newStageName} onChange={event => setNewStageName(event.target.value)} placeholder="Ej. En seguimiento" /></label><label>Color<input type="color" value={newStageColor} onChange={event => setNewStageColor(event.target.value)} /></label></div><div className="crm-modal-footer"><button type="button" className="crm-secondary-button" onClick={() => setShowNewStage(false)}>Cancelar</button><button type="submit" className="crm-primary-button" disabled={saving}><Plus size={15} /> Añadir etapa</button></div></form></div></ModalPortal>}
    </main>
  )
}
