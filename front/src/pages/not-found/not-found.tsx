// text-emerald-900 text-purple-900 text-zinc-900 text-sky-900 text-neutral-900 text-stone-900 text-red-900 text-pink-900

import { app } from "@/atoms/kuepa"
import { AppLayout } from "@/components/layouts/app-layout"
import { Button } from "@/components/ui/button"
import { useStore } from "@nanostores/react"

function NotFound () {
  const $app = useStore(app)
  return (
    <AppLayout module="core" window="not-found">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="flex flex-col justify-center items-center">
          <span className={`flex text-[8rem] font-brand text-${$app.accent}-900 font-bold`}>404</span>
          <span className="flex font-semibold -mt-14 mb-8">Algo salio mal</span>
          <Button tone={$app.accent} variant="default"  className="font-semibold animate-pulse" to="/home">Inicio</Button>
        </div>
      </div>
    </AppLayout>
  )
}

export default NotFound