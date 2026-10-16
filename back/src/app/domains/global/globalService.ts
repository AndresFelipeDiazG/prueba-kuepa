// @import_dependencies

// @import_services

// @import_models

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types

class GlobalService {
  
  
  constructor () {}
  
  public async test (_params) {
    try{
      
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const globalService = new GlobalService()
export { GlobalService }