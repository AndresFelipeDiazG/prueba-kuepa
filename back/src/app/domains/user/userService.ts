// @import_dependencies

// @import_services

// @import_models
import { Third, User } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { authService } from "@domains/auth/authService"

// @import_types


class UserService {
  
  
  constructor () {}
  
  public async upsertAddress (_params) {
    try{

      const user = await User.findOne({_id: _params.user}).lean()
      if(!user) return responseUtility.error('user.not_found')
      let update

      if(user.addresses.find(_a=> _a._id === _params?.address?._id)) {
        update = await User.findOneAndUpdate({_id: _params.user, 'addresses._id': _params.address?._id}, {
          $set:{
            'addresses.$': _params.address
          },
        }, {new:true, lean:true})
      } else {
        update = await User.findOneAndUpdate({_id: _params.user}, {
          $push:{
            addresses: _params.address
          },
        }, {new:true, lean:true})
      }

      const address = update.addresses.find(_a=> _a.address === _params.address.address || _a._id === _params.address?._id) 
      return responseUtility.success({
        user: update,
        address
      })
    } catch (error) {
      console.log('error', error)
    }
  }
    
  public async list (_params) {
    try{
      const where:any = {}
      
      if(_params.farm){
        where.farm = _params.farm
      }
      
      const users = await User.find(where)
      .sort({created_at:-1})
      .limit(50)
      .lean()
      
      return responseUtility.success({
        list:users
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async upsert (_params) {
    try{
      if(_params.password){
        _params.password = await authService.hash(_params.password)
      }
      if(_params._id){
        const user = await User.findOneAndUpdate({_id: _params._id}, {$set: _params}, {new:true, lean:true})
        const third = await Third.findOne({user: user._id})
        if(third){
          await Third.updateOne({_id: third._id}, {$set: {...user.profile, number: user.number}})
        }
        if(_params.merge_homes){
          for (const home of user.homes) {
            const exists = _params.homes.find(_h=> `${home.home}:${home.app}` === `${_h.home}:${_h.app}`)
            if(exists){
              if(home.roles){
                for (const role of home.roles) {
                  if(!exists.roles.find(_r=> _r.toString() === role.toString())){
                    exists.roles.push(role)
                  }
                }
              }
            } else {
              _params.homes.push(home)
            }
          }
          const to_add = user.homes.filter(_h=> !_params.homes.find(__h=> _h.home === __h.home))
          _params.homes = _params.homes.concat(to_add)
        }

        Object.assign(_params, user)
        delete user.password
        return responseUtility.success({
          object: user
        })
      } else {
        const user = await User.create(_params)
        Object.assign(_params, user.toObject())
        return responseUtility.success({
          object: user.toObject()
        })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async get (_params:{_id:string}) {
    try{
      const user = await User.findOne({_id: _params._id}).lean()
      if(!user) return responseUtility.error('user.not_found')
      delete user.password
      return responseUtility.success({
        user
      })
      
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async delete (_params:{_id:string}) {
    try{
      const user = await User.findOne({_id:_params._id})
      if(!user) return responseUtility.error('user.not_found')
      await User.delete({_id: _params._id})
      return responseUtility.success({
        deleted:true
      })
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

export const userService = new UserService()
export { UserService }