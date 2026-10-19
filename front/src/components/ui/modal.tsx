import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export type ModalProps = {
  /** Título principal del modal. */
  title: string
  /** Texto breve bajo el título. */
  description?: string
  /** Antetítulo en mayúsculas sobre el título (suele incluir un emoji). */
  kicker?: string
  /** Ancho del modal: 'sm' para avisos y 'md' (por defecto) para formularios. */
  size?: 'sm' | 'md'
  /** Rol de accesibilidad del diálogo: 'alertdialog' para advertencias. */
  role?: 'dialog' | 'alertdialog'
  /** Clases extra para el contenedor del modal. */
  className?: string
  /** Se llama al cerrar con la X, el fondo o la tecla Escape. */
  onClose: () => void
  /** Bloquea el cierre mientras hay una operación en curso. */
  busy?: boolean
  /** Botones de acción al pie del modal. */
  footer?: ReactNode
  /** Contenido propio del modal, entre el encabezado y el pie. */
  children?: ReactNode
}

/**
 * Modal estándar del CRM: fondo con desenfoque, encabezado morado
 * (kicker + título + descripción) y pie de acciones opcional.
 * Se monta en un portal, por encima del resto de la interfaz.
 */
export function Modal ({
  title,
  description,
  kicker,
  size = 'md',
  role = 'dialog',
  className,
  onClose,
  busy = false,
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose])

  const closeModal = () => { if (!busy) onClose() }

  return createPortal(
    <div className="crm-modal-backdrop" onMouseDown={closeModal}>
      <section
        className={`crm-modal ${size === 'sm' ? 'crm-small-modal' : ''} ${className || ''}`.trim()}
        role={role}
        aria-modal="true"
        aria-label={title}
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="crm-modal-header">
          <div>
            {kicker && <span className="crm-modal-kicker">{kicker}</span>}
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" onClick={closeModal} aria-label="Cerrar" disabled={busy}><X size={17} /></button>
        </div>
        {children}
        {footer && <div className="crm-modal-footer">{footer}</div>}
      </section>
    </div>,
    document.body,
  )
}
