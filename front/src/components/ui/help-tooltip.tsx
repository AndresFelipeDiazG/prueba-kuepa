import * as React from "react"
import { CircleHelp } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type HelpTooltipProps = {
  /** Título de la ventana flotante. */
  title: string
  /** Breve descripción que explica la función o el dato. */
  description: React.ReactNode
  /** Lado en el que aparece la ventana flotante. */
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"]
  /** Distancia entre el icono y la ventana flotante. */
  sideOffset?: number
  /** Clases extra para el icono que dispara la ayuda. */
  className?: string
}

/**
 * Icono de ayuda ("?") tenue de color gris. Al pasar el cursor abre,
 * por encima, una pequeña ventana flotante morada con un título y
 * una breve descripción.
 */
const HelpTooltip = ({
  title,
  description,
  side = "top",
  sideOffset = 8,
  className,
}: HelpTooltipProps) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Ayuda: ${title}`}
          className={cn(
            "crm-help-trigger inline-flex size-5 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0 text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
        >
          <CircleHelp className="size-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className="w-64 rounded-lg border border-[#e6d8f3] bg-[#f8f1fc] p-3 text-[#4c1d95] shadow-lg"
      >
        <p className="text-sm font-semibold text-[#5b21b6]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#6b6076]">
          {description}
        </p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export { HelpTooltip }
export type { HelpTooltipProps }
