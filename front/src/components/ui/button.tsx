import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        input:
          "border border-zinc-200 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      accent:{
        zinc: "hover:bg-zinc-200 hover:text-zinc-800",
        slate: "hover:bg-slate-200 hover:text-slate-800",
        purple: "hover:bg-purple-50 hover:text-purple-800",
        teal: "hover:bg-teal-50 hover:text-teal-800",
        indigo: "hover:bg-indigo-50 hover:text-indigo-800",
        sky: "hover:bg-sky-50 hover:text-sky-800",
        emerald: "hover:bg-emerald-50 hover:text-emerald-800",
        lime: "hover:bg-lime-50 hover:text-lime-800",
        green: "hover:bg-green-50 hover:text-green-800",
        cyan: "hover:bg-cyan-50 hover:text-cyan-800",
        blue: "hover:bg-blue-50 hover:text-blue-800",
        pink: "hover:bg-pink-50 hover:text-pink-800",
        rose: "hover:bg-rose-50 hover:text-rose-800",
      },
      activeAccent:{
        zinc: "bg-zinc-200 text-zinc-800",
        slate: "bg-slate-200 text-slate-800",
        purple: "bg-purple-50 text-purple-800",
        teal: "bg-teal-50 text-teal-800",
        indigo: "bg-indigo-50 text-indigo-800",
        sky: "bg-sky-50 text-sky-800",
        emerald: "bg-emerald-50 text-emerald-800",
        lime: "bg-lime-50 text-lime-800",
        green: "bg-green-50 text-green-800",
        cyan: "bg-cyan-50 text-cyan-800",
        blue: "bg-blue-50 text-blue-800",
        pink: "bg-pink-50 text-pink-800",
        rose: "bg-rose-50 text-rose-800",
      },
      tone:{
        zinc: "bg-zinc-700 text-zinc-50 hover:bg-zinc-800",
        slate: "bg-slate-700 text-slate-50 hover:bg-slate-800",
        purple: "bg-purple-700 text-purple-50 hover:bg-purple-800",
        teal: "bg-teal-700 text-teal-50 hover:bg-teal-800",
        indigo: "bg-indigo-700 text-indigo-50 hover:bg-indigo-800",
        light: "bg-slate-100 text-slate-700 hover:bg-slate-400 hover:text-slate-50",
        sky: "bg-sky-700 text-sky-50 hover:bg-sky-800",
        emerald: "bg-emerald-700 text-emerald-50 hover:bg-emerald-800",
        lime: "bg-lime-700 text-lime-50 hover:bg-lime-800",
        green: "bg-green-700 text-green-50 hover:bg-green-800",
        cyan: "bg-cyan-700 text-cyan-50 hover:bg-cyan-800",
        blue: "bg-blue-700 text-blue-50 hover:bg-blue-800",
        pink: "bg-pink-700 text-pink-50 hover:bg-pink-800",
        rose: "bg-rose-700 text-rose-50 hover:bg-rose-800",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  to?:string
  accent?:'purple'|'teal'|'indigo'|'zinc' | 'slate' | 'sky' | 'emerald'  | 'lime'  | 'green' | 'cyan' | 'blue' | 'pink' | 'rose' | null
  activeAccent?:'purple'|'teal'|'indigo'|'zinc' | 'slate'  | 'sky' | 'emerald' | 'lime'  | 'green' | 'cyan' | 'blue' | 'pink' | 'rose' | null
  tone?:'purple'|'teal'|'indigo'|'zinc' | 'slate'  |'light' | 'sky' | 'emerald'  | 'lime'  | 'green' | 'cyan' | 'blue' | 'pink' | 'rose'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, accent, activeAccent, tone, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      props.to ?  
        <Link to={props.to}>
          <Comp
            className={cn(buttonVariants({ variant, accent, size, activeAccent, tone, className }))}
            ref={ref}
            {...props}
          />
        </Link>
      :
        <Comp
          className={cn(buttonVariants({ variant, size, accent, activeAccent, tone, className }))}
          ref={ref}
          {...props}
        />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
