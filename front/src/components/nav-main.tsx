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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    accent?: string
    can?:string
    items?: {
      title: string
      url: string
      icon?: LucideIcon
      can?:string
    }[]
  }[]
}) {
  const { open } = useSidebar()
  const $app = useStore(app)
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.filter((item)=> item.can ? can(item.can) : true).map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={$app?.sidebar_open?.[item.title]}
            defaultOpen={$app?.sidebar_open?.[item.title]}
            onOpenChange={()=>{
              let sidebar_open = {...app.get()?.sidebar_open}
              if(!sidebar_open) sidebar_open = {}
              sidebar_open[item.title] = !app.get()?.sidebar_open?.[item.title]
              app.set({
                ...(app.get() || {}),
                sidebar_open: sidebar_open
              })
            }}
            className="group/collapsible flex-col"
          >
            <SidebarMenuItem className="flex">
              {
                item.items?.length ?
                  <>
                    {
                      open ? 
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
                              {item.items?.filter(i=> i.can? can(i.can): true).map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <Link to={subItem.url}>
                                    <SidebarMenuSubButton as="div" asChild>
                                      {subItem.icon && <subItem.icon />}
                                        <span>{subItem.title}</span>
                                    </SidebarMenuSubButton>
                                  </Link>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                            
                          </CollapsibleContent>
                        </>
                      : (
                        app.get().sidebar_open?.[item.title] ? 
                          <>
                            {
                              item.items?.filter(i=> i.can? can(i.can): true).map((subItem)=>{
                                return (
                                  <TooltipProvider key={subItem.title}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {
                                          subItem.url !== `/${item.title}` ? 
                                            <Link key={subItem.title} to={subItem.url}>
                                              <SidebarMenuButton key={subItem.title}>
                                                {subItem.icon && <subItem.icon />}
                                                <span>{subItem.title}</span>
                                              </SidebarMenuButton>
                                            </Link>
                                          : 
                                            <Link key={subItem.title} to={item.url}>
                                              <SidebarMenuButton key={item.title}>
                                                {item.icon && <item.icon />}
                                                <span className="capitalize">{subItem.title}</span>
                                              </SidebarMenuButton>
                                            </Link>
                                        }
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="right"
                                        align="center"
                                      >
                                        <p className="capitalize">{ subItem.url !== `/${item.title}` ? subItem.title : item.title}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )
                              })
                            }
                          </>
                        : null
                      )
                    }
                  </>
                : 
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Link to={item.url} key={item.title}>
                          <SidebarMenuButton as="div" asChild className="text-sidebar-foreground/70">
                            <>
                              {item.icon && <item.icon />}
                              <span className="capitalize">{item.title}</span>
                            </>
                          </SidebarMenuButton>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                      >
                        <p className="capitalize">{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                    
              }
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
