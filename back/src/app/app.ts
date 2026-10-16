import express from "express"
import cors from "cors"
import morgan from 'morgan'
const { urlencoded } = require('body-parser') 
import { Routes } from "@app/router"
import config from 'config'
import { request as request_mw } from "@app/middleware/requestMiddleware"
import { DataBaseUtility } from "@core/utilities/dataBaseUtility"
import dotenv from 'dotenv';

dotenv.config();
class App {

  private app: express.Application
  private routes: Routes
  private dataBaseUtility: DataBaseUtility = new DataBaseUtility()

  constructor() {
    this.app = express()
    this.routes = new Routes(this.app)
    
    if(!global.env) global.env = {}
    if(config){
      for (const _k of Object.keys(config)) {
        global.env[_k] = config[_k]
      }
    }
  }

  public async init() {
    if(!global.env) global.env = {}
    
    Object.freeze(global.env)

    this.dataBaseUtility.connectMongo() 

    if (global.env.mode === 'dev' || true) {
      this.app.use(morgan('dev'))
    }
    
    this.app.use(express.json({limit: '40mb'}))

    this.app.use(urlencoded({ extended: false }))

    this.app.use(cors())
    this.app.use(request_mw())
    
    this.app.get('/', (req, res) => {
        res.send('API is running')
    })

    const PORT:string = global.env.port || 5000
    this.routes.init()
    const server  = this.app.listen(PORT, console.log(`Server running  ${PORT}`))
  }

}
export  { App }