import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type HintTooltipProps = {
  /** Texto que aparece al pasar el cursor (normalmente el título del botón). */
  label: string
  /** Elemento que dispara la pista (recibe las props del trigger). */
  children: React.ReactNode
  /** Lado en el que aparece la pista. */
  side?: React.ComponentPropsWithoutRef<typeof TooltipContent>["side"]
  /** Distancia entre el elemento y la pista. */
  sideOffset?: number
}

/**
 * Pista simple: envuelve cualquier elemento y muestra su título
 * en un hover breve al pasar el cursor.
 */
const HintTooltip = ({
  label,
  children,
  side = "top",
  sideOffset = 6,
}: HintTooltipProps) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {label}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

export { HintTooltip }
export type { HintTooltipProps }
