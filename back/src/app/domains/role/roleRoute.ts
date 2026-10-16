// @import_dependencies
import { Application } from "express"

// @import_controllers
import { RoleController } from "@app/domains/role/roleController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class RoleRoute {

  private className:string = 'RoleRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: RoleController = new RoleController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/role'
  
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

export { RoleRoute }







