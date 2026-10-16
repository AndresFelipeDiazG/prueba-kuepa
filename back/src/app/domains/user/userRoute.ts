// @import_dependencies
import { Application } from "express"

// @import_controllers
import { UserController } from "@app/domains/user/userController"
import { request as auth } from "@app/middleware/authMiddleware"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"


class UserRoute {

  private className:string = 'UserRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: UserController = new UserController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/user'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'get', path: '/', handler: this.controller.list , middleware: [auth] },
    { method: 'get', path: '/get/:_id', handler: this.controller.get , middleware: [auth] },
    { method: 'post', path: '/upsert', handler: this.controller.upsert , middleware: [auth] },
    { method: 'post', path: '/upsert-address', handler: this.controller.upsertAddress , middleware: [auth] },
    { method: 'post', path: '/delete', handler: this.controller.delete , middleware: [auth] },
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

export { UserRoute }







