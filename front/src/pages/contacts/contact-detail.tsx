import { FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { app } from '@/atoms/kuepa'
import { useToast } from '@/components/hooks/use-toast'
import { DesignSelect } from '@/components/ui/design-select'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Modal } from '@/components/ui/modal'
import { leadService } from '@/services/leadService'
import { thirdService } from '@/services/thirdService'
import {
  Assignee,
  Contact,
  ContactFieldErrors,
  ContactForm,
  FieldError,
  Program,
  avatarTone,
  contactName,
  departmentOptions,
  documentTypes,
  educationLevels,
  emptyForm,
  formFromContact,
  fullDate,
  initialsOf,
  normalizeTags,
  originLabel,
  origins,
  relativeDate,
  responseMessage,
  todayIso,
  validateContactForm,
} from './contact-shared'

export default function ContactDetail () {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [contact, setContact] = useState<Contact | null>(null)
  const [form, setForm] = useState<ContactForm>({ ...emptyForm, tags: [] })
  const baseline = useRef<ContactForm>({ ...emptyForm, tags: [] })
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [tagInput, setTagInput] = useState('')
  const [programs, setPrograms] = useState<Program[]>([])
  const [assignees, setAssignees] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const applyContact = (next: Contact) => {
    const values = formFromContact(next)
    setContact(next)
    setForm(values)
    baseline.current = values
    setFieldErrors({})
  }

  const loadContact = async () => {
    if (!id) return
    setLoading(true)
    const response = await thirdService.get(id)
    if (response?.code === 200 && response.third) { applyContact(response.third); setNotice('') }
    else setNotice(responseMessage(response))
    setLoading(false)
  }

  useEffect(() => { void loadContact() }, [id])
  useEffect(() => {
    void Promise.all([leadService.programs(), leadService.assignees()]).then(([programResponse, assigneeResponse]) => {
      if (programResponse?.code === 200) setPrograms(programResponse.list || [])
      if (assigneeResponse?.code === 200) setAssignees(assigneeResponse.list || [])
    })
  }, [])
  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'crm',
      window: 'contact',
      back: '/contacts',
      accent: 'purple',
      breadcrumb: [
        { title: 'Contactos', url: '/contacts' },
        { title: contact ? contactName(contact) : 'Contacto', url: `/contacts/${id}` },
      ],
    })
  }, [contact, id])

  const dirty = JSON.stringify(form) !== JSON.stringify(baseline.current)

  const updateField = (field: keyof ContactForm, value: string | string[]) => {
    setForm(current => ({ ...current, [field]: value }))
    setFieldErrors(current => { const next = { ...current }; delete next[field]; return next })
  }
  const addTag = () => { if (!tagInput.trim()) return; updateField('tags', normalizeTags([...form.tags, tagInput])); setTagInput('') }
  const removeTag = (tag: string) => updateField('tags', form.tags.filter(item => item !== tag))
  const discardChanges = () => { setForm({ ...baseline.current, tags: [...baseline.current.tags] }); setFieldErrors({}); setTagInput('') }

  const saveContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contact || !dirty || saving) return
    const errors = validateContactForm(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setSaving(true)
    const response = await thirdService.upsert({
      _id: contact._id,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      number: form.number,
      document_type: form.document_type,
      document: form.document,
      birthdate: form.birthdate,
      city: form.city.trim(),
      department: form.department,
      educationLevel: form.educationLevel,
      tags: normalizeTags(form.tags),
      type: 'cli',
      status: contact.status || 'active',
      ...(form.responsible ? { responsible: form.responsible } : {}),
      ...(form.origin ? { origin: form.origin } : {}),
      ...(form.interestProgram ? { interestProgram: form.interestProgram } : {}),
    })
    if (response?.code === 200 && response.object) {
      applyContact(response.object)
      toast({ title: 'Contacto actualizado', description: 'Los cambios se guardaron correctamente.', className: 'crm-success-toast' })
    } else if (response?.errors) setFieldErrors(response.errors)
    else setNotice(responseMessage(response))
    setSaving(false)
  }

  const saveNote = async () => {
    if (!contact || !noteText.trim()) return
    setSavingNote(true)
    const response = await thirdService.addNote({ _id: contact._id, text: noteText.trim() })
    if (response?.code === 200 && response.object) {
      setContact(response.object)
      setNoteText('')
      setShowNote(false)
      toast({ title: 'Nota agregada', description: 'La nota quedó guardada en el contacto.', className: 'crm-success-toast' })
    } else setNotice(responseMessage(response))
    setSavingNote(false)
  }

  const deleteContact = async () => {
    if (!contact) return
    setDeleting(true)
    const response = await thirdService.delete(contact._id)
    if (response?.code === 200) {
      toast({ title: 'Contacto eliminado', description: 'El contacto se eliminó correctamente.', className: 'crm-success-toast' })
      void navigate('/contacts')
    } else { setNotice(responseMessage(response)); setDeleting(false); setShowDelete(false) }
  }

  if (loading) return <main className="crm-page"><section className="crm-content"><div className="crm-empty-state">⏳ Cargando contacto...</div></section></main>

  if (!contact) return <main className="crm-page"><section className="crm-content">
    <div className="crm-empty-state">
      <span className="crm-empty-emoji" aria-hidden="true">👥</span>
      <h2>No encontramos el contacto</h2>
      <p>{notice || 'Puede que se haya eliminado o que el enlace no sea válido.'}</p>
      <button className="crm-primary-button" onClick={() => void navigate('/contacts')}>Volver a contactos</button>
    </div>
  </section></main>

  const noteCount = contact.notes?.length || 0
  const notesSummary = noteCount ? `sus ${noteCount} ${noteCount === 1 ? 'nota' : 'notas'} y ` : ''

  return <main className="crm-page"><section className="crm-content">
    <button type="button" className="crm-back-button" onClick={() => void navigate('/contacts')}><ArrowLeft size={15} aria-hidden="true" /> Volver a contactos</button>
    <div className="crm-heading"><div><h1>👤 {contactName(form)}</h1><p>Edita la información directamente y guarda los cambios.</p></div></div>
    {notice && <div className="crm-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}

    <div className="crm-record-layout">
      <div className="crm-record-main">
        <form className="crm-record-form" onSubmit={saveContact} noValidate>
          <div className="crm-detail-hero">
            <div className="crm-detail-avatar" style={{ background: avatarTone(contact._id).strong }}>{initialsOf(form)}</div>
            <div>
              <strong>{contactName(form)}</strong>
              <span>{form.tags.length} {form.tags.length === 1 ? 'etiqueta' : 'etiquetas'} · creado {relativeDate(contact.created_at)}</span>
            </div>
          </div>

          <div className="crm-form-grid">
            <label className={fieldErrors.first_name ? 'crm-invalid-field' : ''}><span>Nombre <b>*</b></span><input value={form.first_name} onChange={event => updateField('first_name', event.target.value)} /><FieldError message={fieldErrors.first_name} /></label>
            <label className={fieldErrors.last_name ? 'crm-invalid-field' : ''}><span>Apellido <b>*</b></span><input value={form.last_name} onChange={event => updateField('last_name', event.target.value)} /><FieldError message={fieldErrors.last_name} /></label>
            <label className={fieldErrors.email ? 'crm-invalid-field' : ''}><span>✉️ Correo</span><input type="email" value={form.email} onChange={event => updateField('email', event.target.value)} /><FieldError message={fieldErrors.email} /></label>
            <label className={fieldErrors.number ? 'crm-invalid-field' : ''}><span>📞 Teléfono <b>*</b></span><input inputMode="numeric" maxLength={10} value={form.number} onChange={event => updateField('number', event.target.value.replace(/\D/g, '').slice(0, 10))} /><FieldError message={fieldErrors.number} /></label>
            <label className={fieldErrors.document_type ? 'crm-invalid-field' : ''}><span>Tipo de documento <b>*</b></span><DesignSelect value={form.document_type} invalid={Boolean(fieldErrors.document_type)} onChange={value => updateField('document_type', value)} placeholder="Tipo de documento" options={documentTypes} /><FieldError message={fieldErrors.document_type} /></label>
            <label className={fieldErrors.document ? 'crm-invalid-field' : ''}><span>🪪 Documento <b>*</b></span><input inputMode="numeric" maxLength={20} value={form.document} onChange={event => updateField('document', event.target.value.replace(/\D/g, '').slice(0, 20))} /><FieldError message={fieldErrors.document} /></label>
            <label className={fieldErrors.birthdate ? 'crm-invalid-field' : ''}><span>🎂 Fecha de nacimiento</span><input type="date" max={todayIso()} value={form.birthdate} onChange={event => updateField('birthdate', event.target.value)} /><FieldError message={fieldErrors.birthdate} /></label>
            <label className={fieldErrors.educationLevel ? 'crm-invalid-field' : ''}><span>📚 Nivel de escolaridad</span><DesignSelect value={form.educationLevel} onChange={value => updateField('educationLevel', value)} placeholder="Sin nivel" options={educationLevels} /><FieldError message={fieldErrors.educationLevel} /></label>
            <label className={fieldErrors.city ? 'crm-invalid-field' : ''}><span>🏙️ Ciudad</span><input maxLength={80} value={form.city} onChange={event => updateField('city', event.target.value)} /><FieldError message={fieldErrors.city} /></label>
            <label className={fieldErrors.department ? 'crm-invalid-field' : ''}><span>🗺️ Departamento</span><DesignSelect value={form.department} onChange={value => updateField('department', value)} placeholder="Sin departamento" options={departmentOptions} /><FieldError message={fieldErrors.department} /></label>
            <label><span>🎓 Programa</span><DesignSelect value={form.interestProgram} onChange={value => updateField('interestProgram', value)} placeholder="Sin programa" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label>
            <label><span>👤 Responsable</span><DesignSelect value={form.responsible} onChange={value => updateField('responsible', value)} placeholder="Sin responsable" options={assignees.map(person => ({ value: person._id, label: `${person.profile?.first_name || ''} ${person.profile?.last_name || ''}`.trim() || person.username || 'Sin nombre' }))} /></label>
            <label><span>🌐 Origen</span><DesignSelect value={form.origin} onChange={value => updateField('origin', value)} placeholder="Sin origen" options={origins} /></label>
            <div className="crm-form-full">
              <span className="crm-field-label">🏷️ Etiquetas</span>
              <div className="crm-tag-input">
                <input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} placeholder="Escribe una etiqueta y presiona Enter" />
                <button type="button" onClick={addTag}>➕</button>
              </div>
              <div className="crm-selected-tags">{form.tags.map(tag => <button type="button" key={tag} onClick={() => removeTag(tag)}>🏷️ {tag} ✕</button>)}</div>
            </div>
          </div>

          <div className="crm-record-footer">
            {dirty && <span className="crm-record-dirty">● Cambios sin guardar</span>}
            <button type="button" className="crm-secondary-button" onClick={discardChanges} disabled={!dirty || saving}>Descartar</button>
            <button type="submit" className="crm-primary-button" disabled={!dirty || saving}>{saving ? 'Guardando...' : '💾 Guardar cambios'}</button>
          </div>
        </form>

        {showNote && <div className="crm-note-composer">
          <h3>📝 Nueva nota</h3>
          <textarea value={noteText} maxLength={2000} onChange={event => setNoteText(event.target.value)} placeholder="Escribe una nota sobre este contacto..." autoFocus />
          <div>
            <small>{noteText.length}/2000</small>
            <button type="button" className="crm-secondary-button" onClick={() => { setShowNote(false); setNoteText('') }}>Cancelar</button>
            <button type="button" className="crm-primary-button" disabled={!noteText.trim() || savingNote} onClick={() => void saveNote()}>{savingNote ? 'Guardando...' : 'Guardar nota'}</button>
          </div>
        </div>}

        <div className="crm-notes-list">
          <h3>📝 Notas ({contact.notes?.length || 0})</h3>
          {contact.notes?.length
            ? [...contact.notes].reverse().map((note, index) => <article key={note._id || `${note.created_at}-${index}`}>
                <p>{note.text}</p>
                <small>{fullDate(note.created_at)}</small>
              </article>)
            : <p className="crm-notes-empty">Este contacto todavía no tiene notas.</p>}
        </div>
      </div>

      <aside className="crm-record-side">
        <div className="crm-side-card">
          <h3>⚡ Acciones</h3>
          <HelpTooltip side="left" title="Agregar nota" description="Registra una nota interna en este contacto para llevar el seguimiento de la conversación.">
            <button type="button" className="crm-side-action" onClick={() => setShowNote(true)}>📝 Agregar nota</button>
          </HelpTooltip>
          <HelpTooltip side="left" title="Eliminar contacto" description="Borra el contacto, sus notas y las oportunidades asociadas. Esta acción no se puede deshacer.">
            <button type="button" className="crm-side-action crm-side-danger" onClick={() => setShowDelete(true)} disabled={deleting}>🗑️ Eliminar contacto</button>
          </HelpTooltip>
        </div>

        <div className="crm-side-card">
          <h3>📊 Resumen</h3>
          <div className="crm-record-fact"><span>Creado</span><strong>{fullDate(contact.created_at)}</strong></div>
          <div className="crm-record-fact"><span>Estado</span><strong>{contact.lead_status === 'inactive' ? 'Inactivo' : 'Activo'}</strong></div>
          <div className="crm-record-fact"><span>Origen</span><strong>{originLabel(contact.origin)}</strong></div>
          <div className="crm-record-fact"><span>Etiquetas</span><strong>{contact.tags?.length || 0}</strong></div>
        </div>
      </aside>
    </div>

    {showDelete && <Modal
      size="sm"
      role="alertdialog"
      className="crm-confirm-modal"
      kicker="⚠️ Advertencia"
      title="Eliminar contacto"
      busy={deleting}
      onClose={() => setShowDelete(false)}
      footer={<>
        <button type="button" className="crm-secondary-button" onClick={() => setShowDelete(false)} disabled={deleting}>Cancelar</button>
        <button type="button" className="crm-danger-button" autoFocus disabled={deleting} onClick={() => void deleteContact()}>{deleting ? 'Eliminando...' : '🗑️ Eliminar contacto'}</button>
      </>}
    >
      <p className="crm-warning-text">
        Se eliminará <strong>{contactName(contact)}</strong> de forma permanente junto con {notesSummary}las oportunidades asociadas. Esta acción no se puede deshacer.
      </p>
    </Modal>}
  </section></main>
}
