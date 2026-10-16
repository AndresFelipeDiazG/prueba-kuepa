// @import_dependencies
import { Application } from "express"

// @import_controllers
import { AuthController } from "@app/domains/auth/authController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"

class AuthRoute {

  private className:string = 'AuthRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: AuthController = new AuthController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/auth'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'post', path: '/login', handler: this.controller.login , middleware: [] },
    { method: 'post', path: '/register', handler: this.controller.register , middleware: [] },
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

export { AuthRoute }







