// @import_dependencies
import { Application } from "express"

// @import_controllers
import { PermissionController } from "@app/domains/permission/permissionController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class PermissionRoute {

  private className:string = 'PermissionRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: PermissionController = new PermissionController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/permission'
  
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

export { PermissionRoute }







