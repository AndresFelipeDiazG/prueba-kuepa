// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { GlobalService } from '@app/domains/global/globalService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class GlobalController {
  

  
  private service = new GlobalService()

  constructor () {}

  public test = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.test(_params)
    return responseUtility.build(res, response)
  }
}


export const globalController = new GlobalController()
export { GlobalController }