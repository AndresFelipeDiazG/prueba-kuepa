// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { RoleService } from '@app/domains/role/roleService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class RoleController {
  

  
  private service = new RoleService()

  constructor () {}

  public test = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.test(_params)
    return responseUtility.build(res, response)
  }
  
}


export const roleController = new RoleController()
export { RoleController }