// @import_dependencies
import { Application } from "express"

// @import_controllers
import { ThirdController } from "@app/domains/third/thirdController"


// @import_utilities
import { RouterUtility, IRouteParams } from "@core/utilities/routerUtility"
import { request as auth } from "@app/middleware/authMiddleware"


class ThirdRoute {

  private className:string = 'ThirdRoute'  
  private app: Application
  private routerUtility: RouterUtility
  
  // @declare_controller
  private controller: ThirdController = new ThirdController()
  
  constructor (app: Application, prefix: string) {
    this.app = app
    this.routerUtility = new RouterUtility(this.app, `${prefix}${this.prefix}`)
  }
  
  private prefix: string = '/third'
  
  private routes: Array<IRouteParams> = [
    // @routes
    { method: 'get', path: '/', handler: this.controller.list , middleware: [auth] },
    { method: 'post', path: '/upsert', handler: this.controller.upsert , middleware: [auth] },
    { method: 'post', path: '/ghost', handler: this.controller.ghost , middleware: [auth] },
    { method: 'get', path: '/get/:_id', handler: this.controller.get , middleware: [auth] },
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

export { ThirdRoute }







