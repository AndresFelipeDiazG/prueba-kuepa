// bg-pink-800/95 bg-purple-800/95 bg-rose-800/95 bg-teal-800/95 bg-indigo-800/95 bg-slate-800/95 hover:bg-pink-800/90 hover:bg-purple-800/90 hover:bg-rose-800/90 hover:bg-teal-800/90 hover:bg-indigo-800/90 hover:bg-slate-800/90 hover:bg-purple-700/90 hover:bg-pink-700/90 hover:bg-rose-700/90 hover:bg-teal-700/90 hover:bg-indigo-700/90 hover:bg-slate-700/90
// bg-pink-600/75 bg-purple-600/75 bg-rose-600/75 bg-teal-600/75 bg-indigo-600/75 bg-emerald-600/75 bg-slate-600/75 bg-sky-600/75 bg-slate-600/75 hover:bg-pink-800/85 hover:bg-purple-800/85 hover:bg-rose-800/85 hover:bg-teal-800/85 hover:bg-indigo-800/85 hover:bg-slate-800/85 hover:bg-pink-700/85 hover:bg-purple-700/85 hover:bg-rose-700/85 hover:bg-teal-700/85 hover:bg-indigo-700/85 hover:bg-slate-700/85
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useStore } from "@nanostores/react"
import { app, can, user } from "@/atoms/kuepa"
import authService from "@/services/authService"
import { Link, useNavigate } from "react-router-dom"
import { LuChevronRight, LuChevronUp, LuLogOut } from "react-icons/lu"

export function NavUser() {
  const { isMobile } = useSidebar()
  const location = useNavigate()

  const $user = useStore(user)
  const $app = useStore(app);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={$user?.profile?.avatar} alt={$user?.profile?.avatar} />
                <AvatarFallback className="rounded-lg bg-white/75 backdrop-blur-sm text-slate-900">{$user?.profile?.first_name ? $user?.profile?.first_name?.[0].toUpperCase(): ''}{$user?.profile?.last_name ? $user?.profile?.last_name?.[0].toUpperCase(): ''}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{$user?.profile?.first_name ? $user?.profile?.first_name.split(' ')[0]: ''} {$user?.profile?.last_name ? $user?.profile?.last_name.split(' ')[0]: ''}</span>
                <span className="truncate text-xs">{$user?.username}</span>
              </div>
              <LuChevronRight className="ml-auto hidden md:flex" />
              <LuChevronUp className="ml-auto flex md:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={$user?.profile?.avatar} alt={$user?.profile?.avatar} />
                  <AvatarFallback className={`rounded-lg bg-${$app?.accent}-600/75 backdrop-blur-sm text-white`}>{$user?.profile?.first_name ? $user?.profile?.first_name?.[0].toUpperCase(): ''}{$user?.profile?.last_name ? $user?.profile?.last_name?.[0].toUpperCase(): ''}</AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{$user?.profile?.first_name ? $user?.profile?.first_name.split(' ')[0]: ''} {$user?.profile?.last_name ? $user?.profile?.last_name.split(' ')[0]: ''}</span>
                  <span className="truncate text-xs">{$user?.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={()=>{authService.logout(); location('/auth')}} className="cursor-pointer">
              <LuLogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
