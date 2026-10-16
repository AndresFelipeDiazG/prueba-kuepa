// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { AuthService } from '@app/domains/auth/authService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class AuthController {
  

  
  private service = new AuthService()

  constructor () {}

  public login = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.login(_params)
    return responseUtility.build(res, response)
  }
  
  public register = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.register(_params)
    return responseUtility.build(res, response)
  }
  
  
}


export const authController = new AuthController()
export { AuthController }