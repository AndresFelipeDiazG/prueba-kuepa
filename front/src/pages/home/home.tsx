import { app } from "@/atoms/kuepa"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

export interface HomeProps {
}

export default function Home (props?: HomeProps) {

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'home',
      window: 'crm',
      back: null,
      accent: 'slate',
      breadcrumb:[
        {
          title: 'Home',
          url: '/home'
        }
      ]
    })
  }, [])
  return (
    <>
      <h1 className="flex text-4xl font-title text-slate-800">!Hola!</h1>
    </>
  )
}