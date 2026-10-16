import { access, token, user } from "../atoms/kuepa"
import { post } from "../util/http"
const API = '/auth'

export class AuthService {
  private api:string

  constructor (api:string) {
    this.api = api
  }

  public async login ({username, password}: {username:string,password:string}, app?: any)  {
    
    const response = await post({api:`${this.api || API}/login`, options: {data: {username, password, app} }})
    return response
  }

  public async token ({token}: {token:string}, app?: any)  {
    const response = await post({api:`${this.api || API}/login`, options: {data: {token, app} }})
    return response
  }
  
  public async loginCode ({user, code, brand}: {user:string,code:string,brand:string}, app: any = 'kuepa')  {
    const response = await post({api:`${this.api || API}/login-code`, options: {data: {user, code, brand, app} }})
    return response
  }

  public async authEntities ()  {
    const response = await post({api:`${this.api || API}/auth-entities`, options: {data: {}}})
    return response
  }

  public async logout ()  {
    user.set(null)
    token.set(null)
    
    access.set({can:[]})
    setTimeout(()=>{
      localStorage.removeItem(`kuepa:1.0:${user.get()?._id || 'no-user'}:context:access`)
    },1000)
  }
}

const authService = new AuthService(API)
export default authService