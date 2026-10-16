import { can } from "../atoms/kuepa"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BsClipboardHeart, BsDeviceSsd, BsFillLayersFill, BsFillPersonBadgeFill,  BsLayoutTextSidebarReverse, BsMagnet, BsPass, BsTicketPerforated, BsTv } from "react-icons/bs"
import { MenubarSeparator } from "@radix-ui/react-menubar"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export interface AppLayoutProps {
  className: string
  module?: string
  window?: string
}

export function Sidebar({ className, module, window }: AppLayoutProps) {
  const {t} = useTranslation()
  return (
    <div className={cn("pb-12 w-16 md:w-56 bg-slate-50/25", className)}>
      <div className="space-y-2 md:space-y-3 py-1 h-[90vh] md:h-full">
        <div className="px-0 md:px-3 py-1 md:py-1">
          <div className="space-y-1 relative">
            <Button accent="slate" activeAccent={module === 'core' && window ==='home'  ? 'slate' : null} to={'/home'} variant="ghost" className="w-full justify-center md:justify-start px-3 text-center md:px-4">
              <BsFillLayersFill className="mr-0 md:mr-2 h-5 w-5 text-slate-800"/>
              <span className="hidden md:block">{t('sidebar.home')}</span>
            </Button>
          </div>
        </div>
        <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
        
        {
          can('sidebar:erp')?
            <>
              <div className="px-0 md:px-3 py-1">
                <Link to={'/erp'} className="hidden md:block text-sky-700 mb-1.5 px-4 text-lg font-semibold tracking-tight">
                  {t('sidebar.erp')}
                </Link>
                <div className="space-y-1 relative">
                  {
                    can('sidebar:tasks')?
                      <Button accent="sky" activeAccent={module === 'erp' && window === 'task' ? 'sky': null} to="/erp/tasks" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsLayoutTextSidebarReverse className="mr-0 md:mr-2 h-5 w-5 text-sky-800"/>
                        <span className="hidden md:block">{t('sidebar.tasks')}</span>
                      </Button>
                    : null
                  }
                </div>
              </div>
              <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
            </>
          : null
        }
        {
          can('sidebar:crm')?
            <>
              <div className="px-0 md:px-3 py-1 md:py-1.5">
                <Link to={'/crm'} className="hidden md:block text-purple-700 mb-1.5 px-4 text-lg font-semibold tracking-tight">
                  {t('sidebar.crm')}
                </Link>
                <div className="space-y-1 relative">
                  {
                    can('sidebar:leads')?
                      <>
                        <Button to="/crm/leads" activeAccent={module === 'crm' && window === 'lead' ? 'purple': null} accent="purple" variant="ghost" className="w-full justify-center md:justify-start px-3 text-center md:px-4">
                          <BsMagnet className="mr-0 md:mr-2 h-5 w-5 text-purple-800"/>
                          <span className="hidden md:block">{t('sidebar.leads')}</span>
                        </Button>
                      </>
                    : null
                  }
                </div>
              </div>
              <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
            </>
          : null
        }
        {
          can('sidebar:trade')?
            <>
              <div className="px-0 md:px-3 py-1 md:py-1.5">
              <Link to={'/trade'} className="hidden md:block text-teal-700 mb-1.5 px-4 text-lg font-semibold tracking-tight">
                  {t('sidebar.trade')}
                </Link>
                <div className="space-y-1 relative">
                  {
                    can('sidebar:orders')?
                      <Button accent="teal" activeAccent={module === 'trade' && window === 'order' ? 'teal': null} to="/trade/orders" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsClipboardHeart className="mr-0 md:mr-2 h-5 w-5 text-teal-800"/>
                        <span className="hidden md:block">{t('sidebar.orders')}</span>
                      </Button>
                    : null
                  }
                  {
                    can('sidebar:dates')?
                      <Button accent="teal" activeAccent={module === 'trade' && window === 'dates' ? 'teal': null} to="/trade/dates" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsPass className="mr-0 md:mr-2 h-5 w-5 text-teal-800"/>
                        <span className="hidden md:block">{t('sidebar.Dates')}</span>
                      </Button>
                    : null
                  }
                  {
                    can('sidebar:booking')?
                      <Button accent="teal" activeAccent={module === 'trade' && window === 'booking' ? 'teal': null} to="/trade/booking" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsTicketPerforated className="mr-0 md:mr-2 h-5 w-5 text-teal-800"/>
                        <span className="hidden md:block">{t('sidebar.Booking')}</span>
                      </Button>
                    : null
                  }
                </div>
              </div>
              <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
            </>
          : null
        }
        {
          can('sidebar:web')?
            <>
              <div className="px-0 md:px-3 py-1 md:py-1.5">
              <Link to={'/web'} className="hidden md:block text-indigo-700 mb-1.5 px-4 text-lg font-semibold tracking-tight">
                {t('sidebar.web')}
                </Link>
                <div className="space-y-1 relative">
                  {
                    can('sidebar:displays')?
                      <Button accent="indigo" activeAccent={module === 'magic' && window === 'stores' ? 'indigo': null} to="/web/displays" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsTv className="mr-0 md:mr-2 h-5 w-5 text-indigo-800"/>
                        <span className="hidden md:block">{t('sidebar.displays')}</span>
                      </Button>
                    : null
                  }
                </div>
              </div>
              <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
            </>
          : null
        }
        {
          can('sidebar:magic')?
            <>
              <div className="px-0 md:px-3 py-1 md:py-1.5">
                <Link to={'/magic'} className="hidden md:block text-rose-700 mb-1.5 px-4 text-lg font-semibold tracking-tight">
                  {t('sidebar.magic')}
                </Link>
                <div className="space-y-1 relative">
                  {
                    can('sidebar:store')?
                      <Button accent="rose" activeAccent={module === 'web' && window === 'posts' ? 'rose': null} to="/magic/stores" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                        <BsDeviceSsd className="mr-0 md:mr-2 h-5 w-5 text-rose-800"/>
                        <span className="hidden md:block">{t('sidebar.magic-store')}</span>
                      </Button>
                    : null
                  }
                </div>
              </div>
              <MenubarSeparator className="h-px mx-1 bg-slate-200/75" />
            </>
          : null
        }
        {
          can('sidebar:users')?
            <div className="px-0 md:px-3 py-1 md:py-1.5">
              <div className="space-y-1 relative">
                <Button to="/users" activeAccent={module === 'core' && window ==='user' ? 'slate': null} accent="slate" variant="ghost" className="w-full justify-center md:justify-start px-3 md:px-4">
                  <BsFillPersonBadgeFill className="mr-0 md:mr-2 h-5 w-5 text-slate-800"/>
                  <span className="hidden md:block">{t('sidebar.users')}</span>
                </Button>
              </div>
            </div>
          : null
        }
      </div>
    </div>
  )
}