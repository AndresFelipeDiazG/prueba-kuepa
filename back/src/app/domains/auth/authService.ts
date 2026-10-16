// @import_dependencies
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
// @import_services

// @import_models
import { User } from "@app/models"
import config from "config"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import mongoose from 'mongoose'
import moment from 'moment'

// @import_types


class AuthService {
  
  
  constructor () {}
  
  public async login (_params) {
    try{
      let user
      let _token
      if(_params.token){
        try{
          _token = jwt.verify(_params.token, config.jwt)
        } catch (error) { }
        if(_token?.user){
          user = await User.findOne({_id: _token.user})
          .populate({
            path:'homes.roles',
            select:'permission',
            options: { lean:true },
            populate:{
              path: 'permissions',
              select: 'content',
              options: { lean:true}
            }
          })
          .lean()
        }
      }
      if(!user) {
        user = await User.findOne({username:_params.username})
        .populate({
          path:'homes.roles',
          select:'name permission',
          options: { lean:true },
          populate:{
            path: 'permissions',
            select: 'content',
            options: { lean:true}
          }
        })
        .lean()
        
      }
      if(!user) return responseUtility.error('user.not_found');
      if(!_token){
        const validation = await this.compare(_params.password, user.password)
        // If password validation fails, return an error response
        if(!validation){
          return responseUtility.error('auth.login.error')
        }
      }
      
      let additional:any = {}
      
      if(_params.app){
        const current = user.homes.find(_h=> _h.app === _params.app && _h.current === true)
        if(current){
          if(current.resources.length){
            for (const resource of current.resources) {
              additional[resource.model.toLowerCase()] = await mongoose.model(resource.model).findOne({_id: resource.model_id}).lean()
            }
            if(additional.third && additional.third?.status !== 'active'){
              return responseUtility.error('auth.login.inactive', null, { code: 401 })
            }
          }
          current.can = []
          if(current.roles){
            for (const role of current.roles) {
              for (const permission of role.permissions) {
                permission.content && current.can.push(permission.content)
              }
            }
            additional.home = current.roles[0]?.name?.toLowerCase()
          }
          additional.current = true
        } else {
          additional.home = 'home'
        }
        user.homes = user.homes.filter(_h=> _h.app === _params.app || _h.module)
      }
      
      const token = await this.token(user)
      
      delete user.password

      User.updateOne({_id: user._id}, {$set:{last_login: moment.utc().toISOString()}})
      .then().catch()
      
      return responseUtility.success({
        user,
        token,
        ...additional
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  public async register (_params) {
    try{
      let user = await User.findOne({username:_params.username}).lean()
      if(user) return responseUtility.error('auth.register.username_already_taken')
        
      if(_params.password){
        _params.password = await this.hash(_params.password)
      }
      
      
      user = await User.create(_params)
      user = user.toObject()
      
      return responseUtility.success({
        user
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async hash (password) {
    try{
      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(password, salt)
      return hash
    } catch (error) {
      console.log('error', error)
    }
  }
  
  private async compare (password, hash) {
    try{
      return await bcrypt.compare(password, hash)
    } catch (error) {
      console.log('error', error)
    }
  }
  
  private async token (user) {
    try{
      return jwt.sign({ user: user._id }, config.jwt, {
        expiresIn: '30d'
      })
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const authService = new AuthService()
export { AuthService }