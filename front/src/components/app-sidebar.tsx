// bg-purple-700 text-white bg-slate-700 bg-pink-700 bg-sky-700 bg-emerald-700 bg-lime-700 bg-green-700 bg-cyan-700 bg-blue-700 bg-rose-700 bg-indigo-700 bg-slate-700 hover:bg-purple-700 hover:text-white hover:bg-slate-700 hover:bg-pink-700 hover:bg-sky-700 hover:bg-emerald-700 hover:bg-lime-700 hover:bg-green-700 hover:bg-cyan-700 hover:bg-blue-700 hover:bg-rose-700 hover:bg-indigo-700 hover:bg-slate-700

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TopMenu } from "@/components/top-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { app, user } from "@/atoms/kuepa"
import {  TbHeartHandshake, TbHomeHeart, TbMessageHeart } from "react-icons/tb"
import { useStore } from "@nanostores/react"
// This is sample data.
const data:any = {
  user: {
    name: `${user.get()?.profile?.first_name} ${user.get()?.profile?.last_name}`,
    email: user.get()?.username,
    avatar: user.get()?.profile?.avatar,
  },
  navMain: [
    {
      title: "Inicio",
      url: "/home",
      icon: TbHomeHeart,
      accent: 'slate',
    },
    {
      title: "crm",
      url: "/crm",
      icon: TbMessageHeart,
      isActive: true,
      accent: 'sky',
      can: 'sidebar:crm',
      items: [
        {
          title: "Contactos",
          icon: TbHeartHandshake,
          url: "/leads",
          can: 'crm:leads',
        },
      ],
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const $app = useStore(app)
  return (
    <Sidebar collapsible="icon" className={`text-white transition-all ease-in-out`} {...props}>
      <SidebarHeader>
        <TopMenu/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[...data.navMain, ...( $app.favorites || [])]} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
