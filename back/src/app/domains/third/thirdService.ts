// @import_dependencies

// @import_services

// @import_models
import {  Lead, Third } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { authService } from "@domains/auth/authService"

export interface IEmailFactory {
  accounts_config: any,
  third: string
  qty: number
}

class ThirdService {
  
  
  constructor () {}
  
  public async ghost (_params:{brand:string, type:string}) {
    try {
      const third = await Third.findOne({
        brand: _params.brand,
        type: _params.type,
        $or:[
          {first_name: 'New third'},
        ]
      })
      .lean()
      
      if(third){
        return responseUtility.success({
          object: third
        })
      } else {
        const create = await Third.create({
          name: 'New third',
          first_name: 'New third',
          type: _params.type,
        })
        
        return responseUtility.success({  
          object: create.toObject()
        })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async list (_params) {
    try{
      const where:any = {
        brand:_params.brand,
      }

      if(_params.type){
        where.type = _params.type
      }
      
      if(_params.user){
        where.user = {$exists: true}  
      }
      
      if(_params.filters && _params.filters !== ''){
        where.$or = [
          {first_name: {$regex:`.*${_params.filters}.*`, $options: 'i'}},
          {last_name: {$regex:`.*${_params.filters}.*`, $options: 'i'}},
          {document: {$regex:`.*${_params.filters}.*`, $options: 'i'}},
          {number: {$regex:`.*${_params.filters}.*`, $options: 'i'}},
          {'channels.value': {$regex:`.*${_params.filters}.*`, $options: 'i'}}
        ]
        
        let thirds = await Third.find(where)
        .populate({
          path: 'user',
          select: 'username',
          options: {lean:true}
        })
        .sort({incremental:-1})
        .limit(200)
        .lean()
        
        return responseUtility.success({
          list:thirds
        })
      } else {
        let thirds = await Third.find(where)
        .populate({
          path: 'user',
          select: 'username',
          options: {lean:true}
        })
        .limit(100)
        .sort({first_name:1})
        .lean()
        
        return responseUtility.success({
          list:thirds
        })
      }
      
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async get (_params) {
    try{
      const third = await Third.findOne({_id:_params._id})
      .populate({
        path: 'user',
        lean: true
      })
      .lean()
      let lead, interactions = []
      if(third.type === 'cli'){
        lead = (
          await Lead.find({contact: _params._id})
          .sort({created_at:-1})
          .lean()
          .limit(1)
        )[0]
      }
      
      return responseUtility.success({
        third,
        lead,
        interactions
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async upsert (_params) {
    try{
      if(_params.type === 'sup'){
        if(_params.name) _params.first_name = _params.name
      }
      if(_params._id){
        const third = await Third.findOneAndUpdate({_id:_params._id},{
          $set:_params
        }, {lean:true, new:true})
        
        return responseUtility.success({
          object:third
        })
      } else {
        const _third = await Third.create({ 
          location:{
            type: 'Point',
            coordinates: [0, 0],
          },
          ..._params
        })
        const third = _third.toObject()

        return responseUtility.success({
          object: _third.toObject()
        })
      }
      
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async test (_params) {
    try{
      
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const thirdService = new ThirdService()
export { ThirdService }