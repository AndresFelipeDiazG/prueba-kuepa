import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useTranslation } from "react-i18next"
import { useFullscreen } from "@mantine/hooks"
import { Separator } from "@radix-ui/react-dropdown-menu"
import { LuChevronDown, LuChevronRight } from "react-icons/lu"

export function TopMenu() {
  const { isMobile } = useSidebar()
  const { toggle, fullscreen } = useFullscreen()
  const { toggleSidebar } = useSidebar()
  const {t} = useTranslation()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="backdrop-blur-sm bg-white/80 text-slate-900 hover:bg-white/90 hover:text-slate-900 active:bg-white/90 active:text-slate-900 transition-all"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <img src={'/logo.jpeg'} className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Kuepa
                </span>
                <span className="truncate text-xs">Empresarial</span>
              </div>
              <LuChevronRight className="ml-auto hidden md:flex" />
              <LuChevronDown className="ml-auto flex md:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem className={`hover:bg-slate-50/50`}>Soporte Tecnico</DropdownMenuItem>
            <Separator className="my-2" />
            <DropdownMenuItem className={`hover:bg-slate-50/50`}>Kuepa</DropdownMenuItem>
            {
            !fullscreen ? 
              <DropdownMenuItem onClick={toggle} className={`hover:bg-slate-50/50`}>Pantalla completa</DropdownMenuItem>
              : 
              <DropdownMenuItem onClick={toggle} className={`hover:bg-slate-50/50`}>Salir de pantalla completa</DropdownMenuItem>
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
