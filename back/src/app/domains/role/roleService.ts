// @import_dependencies

// @import_services

// @import_models
import { Role } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types


class RoleService {
  
  
  constructor () {}
  
  
  
  public async test (_params) {
    try{
      
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const roleService = new RoleService()
export { RoleService }