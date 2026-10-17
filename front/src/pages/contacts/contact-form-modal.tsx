import { FormEvent, useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '@/components/hooks/use-toast'
import { DesignSelect } from '@/components/ui/design-select'
import { thirdService, type ContactPayload } from '@/services/thirdService'
import {
  Assignee,
  Contact,
  ContactFieldErrors,
  ContactForm,
  FieldError,
  ModalPortal,
  Program,
  documentTypes,
  emptyForm,
  formFromContact,
  normalizeTags,
  origins,
  responseMessage,
  validateContactForm,
} from './contact-shared'

type ContactFormModalProps = {
  contact?: Contact | null
  programs: Program[]
  assignees: Assignee[]
  onClose: () => void
  onSaved: () => void
}

export default function ContactFormModal ({ contact, programs, assignees, onClose, onSaved }: ContactFormModalProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<ContactForm>(() => contact ? formFromContact(contact) : { ...emptyForm, tags: [] })
  const [tagInput, setTagInput] = useState('')
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  const closeModal = () => { if (!saving) onClose() }
  const updateForm = (field: keyof ContactForm, value: string | string[]) => {
    setForm(current => ({ ...current, [field]: value }))
    setFieldErrors(current => { const next = { ...current }; delete next[field]; return next })
  }
  const addTag = () => { if (!tagInput.trim()) return; updateForm('tags', normalizeTags([...form.tags, tagInput])); setTagInput('') }

  const submitContact = async (event: FormEvent) => {
    event.preventDefault()
    const errors = validateContactForm(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setSaving(true)
    const payload: ContactPayload = {
      ...(contact?._id ? { _id: contact._id } : {}),
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      number: form.number,
      document_type: form.document_type,
      document: form.document,
      tags: normalizeTags(form.tags),
      type: 'cli',
      status: contact?.status || 'active',
      ...(form.responsible ? { responsible: form.responsible } : {}),
      ...(form.origin ? { origin: form.origin } : {}),
      ...(form.interestProgram ? { interestProgram: form.interestProgram } : {}),
    }
    const response = await thirdService.upsert(payload)
    if (response?.code === 200) {
      toast({ title: contact ? 'Contacto actualizado' : 'Contacto creado', description: 'La información se guardó correctamente.', className: 'crm-success-toast' })
      onSaved()
    } else if (response?.errors) setFieldErrors(response.errors)
    else setNotice(responseMessage(response))
    setSaving(false)
  }

  return <ModalPortal>
    <div className="crm-modal-backdrop" onMouseDown={closeModal}>
      <form className="crm-modal crm-contact-modal" onSubmit={submitContact} onMouseDown={event => event.stopPropagation()} noValidate>
        <div className="crm-modal-header">
          <div>
            <span className="crm-modal-kicker">👥 Directorio comercial</span>
            <h2>{contact ? 'Editar contacto' : 'Nuevo contacto'}</h2>
            <p>Información personal y comercial del contacto.</p>
          </div>
          <button type="button" onClick={closeModal} aria-label="Cerrar"><X size={17} /></button>
        </div>
        <div className="crm-form-grid">
          <label className={fieldErrors.first_name ? 'crm-invalid-field' : ''}><span>Nombre <b>*</b></span><input autoFocus value={form.first_name} onChange={event => updateForm('first_name', event.target.value)} /><FieldError message={fieldErrors.first_name} /></label>
          <label className={fieldErrors.last_name ? 'crm-invalid-field' : ''}><span>Apellido <b>*</b></span><input value={form.last_name} onChange={event => updateForm('last_name', event.target.value)} /><FieldError message={fieldErrors.last_name} /></label>
          <label className={fieldErrors.email ? 'crm-invalid-field' : ''}><span>✉️ Correo</span><input type="email" value={form.email} onChange={event => updateForm('email', event.target.value)} /><FieldError message={fieldErrors.email} /></label>
          <label className={fieldErrors.number ? 'crm-invalid-field' : ''}><span>📞 Teléfono <b>*</b></span><input inputMode="numeric" maxLength={10} value={form.number} onChange={event => updateForm('number', event.target.value.replace(/\D/g, '').slice(0, 10))} /><FieldError message={fieldErrors.number} /></label>
          <label className={fieldErrors.document_type ? 'crm-invalid-field' : ''}><span>Tipo de documento <b>*</b></span><DesignSelect value={form.document_type} invalid={Boolean(fieldErrors.document_type)} onChange={value => updateForm('document_type', value)} placeholder="Tipo de documento" options={documentTypes} /><FieldError message={fieldErrors.document_type} /></label>
          <label className={fieldErrors.document ? 'crm-invalid-field' : ''}><span>🪪 Documento <b>*</b></span><input inputMode="numeric" maxLength={20} value={form.document} onChange={event => updateForm('document', event.target.value.replace(/\D/g, '').slice(0, 20))} /><FieldError message={fieldErrors.document} /></label>
          <label><span>🎓 Programa</span><DesignSelect value={form.interestProgram} onChange={value => updateForm('interestProgram', value)} placeholder="Sin programa" options={programs.map(program => ({ value: program._id, label: program.name }))} /></label>
          <label><span>👤 Responsable</span><DesignSelect value={form.responsible} onChange={value => updateForm('responsible', value)} placeholder="Sin responsable" options={assignees.map(person => ({ value: person._id, label: `${person.profile?.first_name || ''} ${person.profile?.last_name || ''}`.trim() || person.username || 'Sin nombre' }))} /></label>
          <label><span>🌐 Origen</span><DesignSelect value={form.origin} onChange={value => updateForm('origin', value)} placeholder="Sin origen" options={origins} /></label>
          <div className="crm-form-full">
            <span className="crm-field-label">🏷️ Etiquetas</span>
            <div className="crm-tag-input">
              <input value={tagInput} onChange={event => setTagInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addTag() } }} placeholder="Escribe una etiqueta y presiona Enter" />
              <button type="button" onClick={addTag}>➕</button>
            </div>
            <div className="crm-selected-tags">{form.tags.map(tag => <button type="button" key={tag} onClick={() => updateForm('tags', form.tags.filter(item => item !== tag))}>🏷️ {tag} ✕</button>)}</div>
          </div>
        </div>
        {notice && <p className="crm-form-notice" role="alert">{notice}</p>}
        <div className="crm-modal-footer">
          <button type="button" className="crm-secondary-button" onClick={closeModal}>Cancelar</button>
          <button type="submit" className="crm-primary-button" disabled={saving}>{saving ? 'Guardando...' : contact ? 'Guardar cambios' : 'Crear contacto'}</button>
        </div>
      </form>
    </div>
  </ModalPortal>
}
