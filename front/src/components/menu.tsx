// rounded-lg bg-purple-950/85 bg-rose-950/85 bg-teal-950/85 bg-indigo-950/85 bg-slate-950/85 hover:bg-slate-50/50 hover:bg-rose-50/50 hover:bg-purple-700/50 hover:bg-teal-700/50 hover:bg-rose-700/50 hover:bg-indigo-700/50 hover:text-purple-200 hover:text-teal-200 hover:text-rose-200 hover:text-indigo-200 hover:text-slate-200 hover:bg-sky-700/50 hover:text-sky-200 bg-sky-950/85
// animate-ping
import { attendance, theme, user } from "@/atoms/kuepa"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { AuthService } from "@/services/authService"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {   BsSearch } from "react-icons/bs"
import {  useNavigate } from "react-router-dom"

import { useFullscreen } from "@mantine/hooks"

export interface MenuProps {
  module?: string
  window?: string
  setSearch?: (value: boolean) => void
  search?: boolean
}


export function Menu(props: MenuProps) {
  const { module } = props;
  const [active, setActive] = useState<string>('false');

  const [open, setOpen] = useState<boolean>(false);
  const [scanned, setScanned] = useState<number>(0);
  const { t } = useTranslation()
  const $user = useStore(user);
  const $attendance = useStore(attendance)
  const authService = new AuthService('/auth')
  const location = useNavigate()

  const { toggle, fullscreen } = useFullscreen()

  useEffect(()=>{
    if(module === 'core'){
      setActive('slate')
      theme.set('slate')
    } else if(module === 'crm'){
      setActive('purple')
      theme.set('purple')
    } else if(module === 'web'){
      setActive('indigo')
      theme.set('indigo')
    } else if(module === 'trade'){
      setActive('teal')
      theme.set('teal')
    } else if(module === 'erp'){
      setActive('sky')
      theme.set('sky')
    } else if(module === 'magic'){
      setActive('rose')
      theme.set('rose')
    } else {
      setActive('slate')
      theme.set('slate')
    }
  }, [module])

  return (
    <Menubar className={`rounded-none border-t-0 border-s-0 border-e-0 border-b-[1pt] border-solid bg-${active}-950/85 text-white px-2 lg:px-4 transition-all`}>
      <MenubarMenu>
        <MenubarTrigger className={`px-0 md:px-2 pt-3 pb-1 font-bold text-white font-brand text-2xl hover:text-${active}-200`}>
          Kuepa
        </MenubarTrigger>
        <MenubarContent sideOffset={-2} accent={active}>
          <MenubarItem className='hover:bg-slate-50/50'>
            {$user?.username?.split('@')[0]}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem className='hover:bg-slate-50/50'>
            Kuepa
          </MenubarItem>
          <MenubarItem className='hover:bg-slate-50/50'>
            {t('menu.preferences')}
          </MenubarItem>
          {
            !fullscreen ? 
              <MenubarItem onClick={toggle} className={`hover:bg-slate-50/50`}>Pantalla completa</MenubarItem>
              : 
              <MenubarItem onClick={toggle} className={`hover:bg-slate-50/50`}>Salir de pantalla completa</MenubarItem>
          }
          <MenubarSeparator />
          <MenubarItem className={`hover:bg-slate-50/50`}>{t('menu.about')} Kuepa</MenubarItem>
          <MenubarItem className='hover:bg-slate-50/50'>{t('menu.about')} Ket</MenubarItem>
          <MenubarItem onClick={()=>{authService.logout(); location('/auth')}} className='hover:bg-slate-50/50'>Cerrar sesión</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <div className="hidden select-none md:flex absolute content-center left-1/2 transform -translate-x-1/2">
        <MenubarLabel className="flex">
        
          {module !== 'core'? module : ''}  
          
        </MenubarLabel>
      </div>
      <div className="flex w-full justify-end pe-2 lg:pe-4">
        <MenubarMenu>
          <MenubarTrigger onClick={()=> props.setSearch(!props.search)} ><BsSearch /></MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
        </MenubarMenu>
      </div>
    </Menubar>
  )
}