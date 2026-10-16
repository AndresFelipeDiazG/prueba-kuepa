// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { ThirdService } from '@app/domains/third/thirdService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class ThirdController {
  

  
  private service = new ThirdService()

  constructor () {}

  public test = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.test(_params)
    return responseUtility.build(res, response)
  }

  public list = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.list(_params)
    return responseUtility.build(res, response)
  }

  public upsert = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.upsert(_params)
    return responseUtility.build(res, response)
  }
  
  public get = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.get(_params)
    return responseUtility.build(res, response)
  }  

  public ghost = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.ghost(_params)
    return responseUtility.build(res, response)
  }  
}


export const thirdController = new ThirdController()
export { ThirdController }