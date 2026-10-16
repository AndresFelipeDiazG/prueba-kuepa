import { app } from "@/atoms/kuepa"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export interface LeadsProps {
}

export default function Leads (props?: LeadsProps) {

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'leads',
      window: 'crm',
      back: null,
      accent: 'purple',
      breadcrumb:[
        {
          title: 'Leads',
          url: '/leads'
        }
      ]
    })
  }, [])
  return (
    <>
      <h1 className="flex text-4xl font-title text-purple-800">!Hola!</h1>
    </>
  )
}