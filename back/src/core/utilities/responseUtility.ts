import { Response } from 'express' 
import { errors } from '@app/resources/errors/errors'


class ResponseUtility {
  
  
  constructor() {}
  
  public build (res: Response, object: any = {}){
    try{
      const code =  object['code'] || 500 
      
      if(object.content_type === 'text/xml'){
        delete object.code
        delete object.status

        res.type(object.content_type)
        delete object.content_type
        object = '<?xml version="1.0" encoding="UTF-8"?>' + this.OBJtoXML(object)
      }
      
      return res.status(code).send(object) 
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public success(object: any = {}, code?: number){
    try{   
      const response = {
        code: 200,
        status: 'success',
        ...object
      }
      return response
      
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public OBJtoXML(obj) {
    var xml = '' 
    for (var prop in obj) {
      xml += "<" + prop + ">" 
      if(obj[prop] instanceof Array) {
        for (var array in obj[prop]) {
          xml += this.OBJtoXML(new Object(obj[prop][array])) 
        }
      } else if (typeof obj[prop] == "object") {
        xml += this.OBJtoXML(new Object(obj[prop])) 
      } else {
        xml += obj[prop] 
      }
      xml += "</" + prop + ">" 
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g,'') 
    return xml
  }
  
  public error(key?:string, variables?:any | null, object?: any | null){
    try{
      const response:any = { code: 500, status: 'error' }
      if(key){
        let error = errors
        
        for (const _k of key.split('.')) {
          if(error[_k]){
            error = error[_k]
          } else {
            break
          }
        }
        
        if(typeof error === 'object'){
          response.code = object?.code || error['code'] || 500
          response.message = key
        } 
        response.system_message = key
        
        if(object){
          Object.assign(response, object)
        }
        
        return response
      } 
      
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const responseUtility = new ResponseUtility()
export { ResponseUtility }