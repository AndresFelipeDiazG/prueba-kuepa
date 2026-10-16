import { Application } from 'express'
import { ProgramController } from '@app/domains/program/programController'
import { request as auth } from '@app/middleware/authMiddleware'
import { IRouteParams, RouterUtility } from '@core/utilities/routerUtility'

class ProgramRoute {
  private routerUtility: RouterUtility
  private controller: ProgramController = new ProgramController()
  private prefix = '/program'

  private routes: Array<IRouteParams> = [
    { method: 'get', path: '/', handler: this.controller.list, middleware: [auth] },
  ]

  constructor (app: Application, prefix: string) {
    this.routerUtility = new RouterUtility(app, `${prefix}${this.prefix}`)
  }

  public init () {
    for (const route of this.routes) this.routerUtility.route(route)
  }
}

export { ProgramRoute }
