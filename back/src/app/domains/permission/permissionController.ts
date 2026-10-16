// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { PermissionService } from '@app/domains/permission/permissionService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class PermissionController {
  

  
  private service = new PermissionService()

  constructor () {}

  public test = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.test(_params)
    return responseUtility.build(res, response)
  }
  
}


export const permissionController = new PermissionController()
export { PermissionController }