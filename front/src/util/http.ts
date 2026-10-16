/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-condition */
import axios, { AxiosError } from "axios"
import { config } from "../config"
import { token, user, access } from "../atoms/kuepa"
import moment from "moment"
const URL = `${config.api}/api`

const app = 'kuepa'

export const get = async(_params:{api:string, options?:any}) =>{
  try{
    if(!_params.options){
      _params.options = {}
    }

    if(_params?.options?.cache){
      const exists = localStorage.getItem(`${app}:cache:get${_params.api}:${token.get()}`)
      if(exists){
        const data = JSON.parse(exists)
        if(moment.utc().diff(moment.utc(data.updated_at), 'minutes') < _params?.options?.cache){
          return JSON.parse(exists)
        } else {
          localStorage.removeItem(`${app}:cache:get${_params.api}:${token.get()}`)
        }
      }
    }

    if(!_params.options.params) _params.options.params = {}
    if(token.get()){
      _params.options.headers ={
        'Authorization': token.get()
      }
    }
    
    const response = await axios.get(`${URL}${_params.api}`, _params.options)
    const data = response.data

    if(_params?.options?.cache){
      if(data.code === 200){
        data.updated_at = moment.utc().toISOString()
        localStorage.setItem(`${app}:cache:get${_params.api}:${token.get()}`, JSON.stringify(data))
      }
    }

    return data
  } catch (error ) {
    if(error instanceof AxiosError){
      if(_params?.options?.cache){
        if(error?.response?.data.code === 404){
          error.response.data.updated_at = moment.utc().toISOString()
          localStorage.setItem(`${app}:cache:get:${_params.api}:${token.get()}`, JSON.stringify(error?.response?.data))
        }
      }
      if(error?.response?.status === 401){
        token.set(null)
        user.set(null)
        access.set(null)
        window.location.href = '/auth'
      }
    } else {
      console.log('error', error)
    }
  }
}

export const post = async(_params:{api:string, options?:{data?:any, config?:any, cache?:number}}) =>{
  try{
    const _data = _params?.options?.data || {}
    const _config = _params?.options?.config || {}


    _data.app = app
    
    if(_params?.options?.cache){
      const exists = localStorage.getItem(`${app}:cache:post:${_params.api}:${token.get()}`)
      if(exists){
        const data = JSON.parse(exists)
        if(moment.utc().diff(moment.utc(data.updated_at), 'minutes') < _params?.options?.cache){
          return JSON.parse(exists)
        } else {
          localStorage.removeItem(`${app}:cache:post:${_params.api}:${token.get()}`)
        }
      }
    }
    
    if(token.get()){
      _config.headers ={
        ..._config.headers || {},
        'Authorization': token.get()
      }
    }

    const response = await axios.post(`${URL}${_params.api}`, _data, _config )
    const data = response.data

    if(_params?.options?.cache){
      if(data.code === 200){
        data.updated_at = moment.utc().toISOString()
        localStorage.setItem(`${app}:cache:post:${_params.api}:${token.get()}`, JSON.stringify(data))
      }
    }
    return data
  } catch (error ) {
    if(error instanceof AxiosError){
      if(error?.response?.data){
        if(_params?.options?.cache){
          if(error?.response?.data.code === 404){
            error.response.data.updated_at = moment.utc().toISOString()
            localStorage.setItem(`${app}:cache:post:${_params.api}:${token.get()}`, JSON.stringify(error?.response?.data))
          }
        }
        if(error?.response?.status === 401){
          token.set(null)
          user.set(null)
          access.set(null)
          window.location.href = '/auth'
        }
        return error.response.data
      } 
    } else {
      console.log('error', error)
    }
  }
}