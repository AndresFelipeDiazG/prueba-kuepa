// @import_dependencies
import { Application } from "express"

// @import_controllers
import { LeadController } from "@app/domains/lead/leadController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class LeadRoute {

  private className:string = 'LeadRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: LeadController = new LeadController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/lead'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'get', path: '/get/:_id', handler: this.controller.get , middleware: [auth] },
    { method: 'get', path: '/', handler: this.controller.list , middleware: [auth] },
    { method: 'post', path: '/test', handler: this.controller.test , middleware: [] },
    { method: 'post', path: '/upsert', handler: this.controller.upsert , middleware: [auth] },
    { method: 'post', path: '/external', handler: this.controller.external , middleware: [] },
    { method: 'post', path: '/adviser-info', handler: this.controller.adviserInfo , middleware: [auth] },
  ] 

  public init () {
    for (const path of this.routes) {
      this.routerUtility.route({
        method: path.method,
        path: path.path,
        handler: path.handler,
        middleware: path.middleware
      })
    }
  }
}

export { LeadRoute }







