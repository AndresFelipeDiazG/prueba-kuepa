import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"
import { useStore } from "@nanostores/react"
import { app, can } from "@/atoms/kuepa"

type NavSubItem = {
  title: string
  url: string
  icon?: LucideIcon
  can?: string
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  accent?: string
  can?: string
  items?: NavSubItem[]
}

type HoveredSubmenu = {
  title: string
  icon?: LucideIcon
  top: number
  left: number
  items: NavSubItem[]
}

export function NavMain ({ items }: { items: NavItem[] }) {
  const { open, isMobile } = useSidebar()
  const $app = useStore(app)
  const [hoveredSubmenu, setHoveredSubmenu] = useState<HoveredSubmenu | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setHoveredSubmenu(null), 180)
  }

  const showSubmenu = (item: NavItem, element: HTMLElement) => {
    if (open || isMobile || !item.items?.length) return
    cancelClose()
    const rect = element.getBoundingClientRect()
    setHoveredSubmenu({
      title: item.title,
      icon: item.icon,
      top: Math.max(8, Math.min(rect.top, window.innerHeight - 180)),
      left: rect.right,
      items: item.items.filter(subItem => subItem.can ? can(subItem.can) : true),
    })
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  const HoveredIcon = hoveredSubmenu?.icon
  const flyout = hoveredSubmenu && !open && !isMobile
    ? createPortal(
      <div
        className="crm-sidebar-submenu-flyout"
        style={{ top: hoveredSubmenu.top, left: hoveredSubmenu.left }}
        role="menu"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="crm-sidebar-submenu-heading">
          {HoveredIcon && <HoveredIcon aria-hidden="true" />}
          <strong>{hoveredSubmenu.title}</strong>
        </div>
        <div className="crm-sidebar-submenu-list">
          {hoveredSubmenu.items.map(subItem => (
            <Link key={subItem.title} to={subItem.url} className="crm-sidebar-submenu-link" role="menuitem">
              {subItem.icon && <subItem.icon aria-hidden="true" />}
              <span>{subItem.title}</span>
            </Link>
          ))}
        </div>
      </div>,
      document.body,
    )
    : null

  return <>
    <SidebarGroup>
      <SidebarMenu>
        {items.filter(item => item.can ? can(item.can) : true).map(item => (
          item.items?.length ? (() => {
            const itemIsOpen = $app?.sidebar_open?.[item.title] ?? true
            const setItemOpen = (value: boolean) => {
              app.set({
                ...(app.get() || {}),
                sidebar_open: {
                  ...(app.get()?.sidebar_open || {}),
                  [item.title]: value,
                },
              })
            }
            const subItems = item.items.filter(subItem => subItem.can ? can(subItem.can) : true)

            return (
              <Collapsible key={item.title} asChild open={itemIsOpen} onOpenChange={setItemOpen} className="group/collapsible flex-col">
                <SidebarMenuItem className="flex">
                  {open ? (
                    <>
                      <CollapsibleTrigger asChild className="flex">
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {subItems.map(subItem => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  {subItem.icon && <subItem.icon />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : (
                    <SidebarMenuButton
                      type="button"
                      onMouseEnter={event => showSubmenu(item, event.currentTarget)}
                      onMouseLeave={scheduleClose}
                      onFocus={event => showSubmenu(item, event.currentTarget)}
                      onClick={() => setItemOpen(!itemIsOpen)}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })() : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} className="text-sidebar-foreground/70">
                <Link to={item.url}>
                  {item.icon && <item.icon />}
                  <span className="capitalize">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        ))}
      </SidebarMenu>
    </SidebarGroup>
    {flyout}
  </>
}
