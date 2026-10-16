// @import_dependencies
import { Application } from "express"

// @import_controllers
import { GlobalController } from "@app/domains/global/globalController"
import { request as auth } from "@app/middleware/authMiddleware"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"


class GlobalRoute {

  private className:string = 'GlobalRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: GlobalController = new GlobalController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/global'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'post', path: '/test', handler: this.controller.test , middleware: [] },
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

export { GlobalRoute }







