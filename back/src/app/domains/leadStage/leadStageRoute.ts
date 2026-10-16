import { Application } from 'express'
import { LeadStageController } from '@app/domains/leadStage/leadStageController'
import { request as auth } from '@app/middleware/authMiddleware'
import { requirePermission } from '@app/middleware/permissionMiddleware'
import { PERMISSIONS } from '@app/resources/permissions'
import { IRouteParams, RouterUtility } from '@core/utilities/routerUtility'

class LeadStageRoute {
  private app: Application
  private routerUtility: RouterUtility
  private controller: LeadStageController = new LeadStageController()
  private prefix = '/lead-stage'

  private routes: Array<IRouteParams> = [
    { method: 'get', path: '/', handler: this.controller.list, middleware: [auth] },
    {
      method: 'post',
      path: '/upsert',
      handler: this.controller.upsert,
      middleware: [auth, requirePermission(PERMISSIONS.MANAGE_LEAD_STAGES)],
    },
    {
      method: 'post',
      path: '/archive',
      handler: this.controller.archive,
      middleware: [auth, requirePermission(PERMISSIONS.MANAGE_LEAD_STAGES)],
    },
  ]

  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }

  public init () {
    for (const route of this.routes) {
      this.routerUtility.route(route)
    }
  }
}

export { LeadStageRoute }
