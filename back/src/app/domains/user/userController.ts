// @import_dependencies
import { Request, Response } from 'express'

// @import_services
import { UserService } from '@app/domains/user/userService'

// @import_models
import {  } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class UserController {
  

  
  private service = new UserService()

  constructor () {}

  public test = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.test(_params)
    return responseUtility.build(res, response)
  }

  public upsert = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.upsert(_params)
    return responseUtility.build(res, response)
  }

  public upsertAddress = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.upsertAddress(_params)
    return responseUtility.build(res, response)
  }

  public delete = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.delete(_params)
    return responseUtility.build(res, response)
  }
  
  public get = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.get(_params)
    return responseUtility.build(res, response)
  } 

  public list = async(req: Request, res: Response) => {
    const _params = req._data()
    const response = await this.service.list(_params)
    return responseUtility.build(res, response)
  } 
  
}


export const userController = new UserController()
export { UserController }