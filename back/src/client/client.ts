import ora from 'ora'
import chalk from 'chalk'
import fs from 'node:fs'
import config from 'config'
import mongoose from 'mongoose'
import { SeederModel } from '@client/models/seederModel'
const args = require('minimist')(process.argv.slice(2))
export interface IConsole extends ora.Ora  {
  log?: (...args: any[]) => void,
  paint?: chalk.Chalk,
}
if(!global.env) global.env = {}

if(config){
  for (const _k of Object.keys(config)) {
    global.env[_k] = config[_k]
  }
}

const client = async() => {
  const _console = console.log
  const decodeName = (name) => {
    const name_array = name.split('-')
    const name_array_camelize = name_array.map((n, i) => {
      if (i !== 0){
        return n.charAt(0).toUpperCase() + n.slice(1)
      } else {
        return n
      }
    })
    return name_array_camelize.join('')
  }
  
  const runSeeders = async (console, force?:boolean) => {
    console.stopAndPersist({
      symbol: '🚀',
      text: `${console.paint.blue('Launching Seeders')}`,
    })
    console.log('')
    console.start()
    const relative = '/src/seeders/'
    const path = `${process.cwd()}${relative}`
    const files = fs.readdirSync(path, {encoding: "utf-8"})
    if (files && files.length > 0) {
      for (const seederName of files.filter(_f=> _f.includes('.ts'))) {
        const name = seederName.replace('.ts', '')
        try{
          const exists = await SeederModel.findOne({name: name}).lean()
          if(exists && !force){
            console.info(`Seeder ${console.paint.blue(name)} already launched`)
            continue
          } else {
            const seeder = require(`${path}${seederName}`)
            const response = await seeder.run(args, console)
            if(response){
              if(!exists){
                await SeederModel.create({name: name})
              }
              console.succeed(`Seeder ${console.paint.green(name)} launched`)
            } else {
              console.fail(`Seeder ${console.paint.red(name)} failed`)
            }
          }
        } catch (error) {
          console.warn(`Seeder ${console.paint.yellow(name)} aborted`)
        }
        console.stop()
      }
    }
    
  }
  
  {
    
    const console:IConsole = ora({
      text: 'ft-cli',
    })
    
    
    console.log = _console
    console.paint = chalk
    
    
    console.stopAndPersist({
      symbol: '🤖',
      text: 'Welcome to ft-cli',
    })
    console.log('')

    
    if(!args.seeder  && !args.task && !args.factory){
      console.fail('Error: No task specified')
      console.stop()
      process.exit(0)
    }
    
    if(args.task){
      const relative = '/src/tasks/'
      const path = `${process.cwd()}${relative}`
      const name = decodeName(args.task)
      const task = require(`${path}${name}Task`)
      const _name = name.replace('Task', '')
      console.info(`Launching task ${console.paint.blue(_name)}`)
      console.start()
      const response = await task.run(args, console)
      if(response){
        console.succeed(`Task ${console.paint.green(_name)} launched`)
        process.exit(0)
      } else {
        console.fail(`Task ${console.paint.red(_name)} failed`)
        process.exit(1)
      }
    } else if(args.factory && args.n){
      const path = args.path
      const _name = args.n.split('-')
      let name = ''
      _name.forEach((_n, _i)=>{
        if(_i === 0){
          name += _n
        } else {
          name += `${_n.charAt(0).toUpperCase() }${_n.slice(1)}`
        }
      })
      const Name = `${name.charAt(0).toUpperCase() }${name.slice(1)}`
      
      if(args.d){
        args.c = true
        args.r = true
        args.s = true
      }

      if(args.m){
        const relative = '/src/app/models'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/modelTemplate.txt`
        
        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        
        while(file.includes('<Model>')) file = file.replace('<Model>', `${Name}`)
        while(file.includes('<model>')) file = file.replace('<model>', name)
        
        await fs.writeFileSync(`${path}/${name}Model.ts`, file )
        
        let index = await fs.readFileSync(`${path}/index.ts`, {encoding: 'utf-8'})
        index = index.replace('@import_models', `@import_models\nimport { ${Name}Model } from '@app/models/${name}Model'`)
        index = index.replace('export {', `export {\n  ${Name}Model as ${Name},`)
        
        await fs.writeFileSync(`${path}/index.ts`, index )
      }
      
      if(args.seeder){
        const relative = '/src/seeders'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/seederTemplate.txt`
        
        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        
        await fs.writeFileSync(`${path}/${name}Seeder.ts`, file )
      }

      if(args.task){
        const relative = '/src/tasks'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/taskTemplate.txt`
        
        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        
        await fs.writeFileSync(`${path}/${name}Task.ts`, file )
      }
      
      if(args.s){
        const relative = '/src/app/domains'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/serviceTemplate.txt`
        
        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        while(file.includes('<Service>')) file = file.replace('<Service>', `${Name}`)
        while(file.includes('<service>')) file = file.replace('<service>', name)

        if(args.m){
          file = file.replace('import {  } from "@app/models"', `import { ${Name} } from "@app/models"`)
        }

        if(await !fs.existsSync(`${path}/${name}`)) await fs.mkdirSync(`${path}/${name}`)
        await fs.writeFileSync(`${path}/${name}/${name}Service.ts`, file )
      }

      if(args.c){
        const relative = '/src/app/domains'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/controllerTemplate.txt`
        
        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        while(file.includes('<Controller>')) file = file.replace('<Controller>', `${Name}`)
        while(file.includes('<controller>')) file = file.replace('<controller>', name)

        if(args.s){
          file = file.replace('@import_services', `@import_services\nimport { ${Name}Service } from '@app/domains/${name}/${name}Service'`)
          file = file.replace('constructor () {}', `private service = new ${Name}Service()\n\n  constructor () {}`)
          file = file.replace('constructor () {}', `constructor () {}\n\n  public test = async(req: Request, res: Response) => {\n    const _params = req._data()\n    const response = await this.service.test(_params)\n    return responseUtility.build(res, response)\n  }`)
        }

        

        if(await !fs.existsSync(`${path}/${name}`)) await fs.mkdirSync(`${path}/${name}`)
        await fs.writeFileSync(`${path}/${name}/${name}Controller.ts`, file )
      }

      if(args.r){
        const relative = '/src/app/domains'
        const path = `${process.cwd()}${relative}`
        const template_file =  `${process.cwd()}/src/client/templates/routeTemplate.txt`

        let file = await fs.readFileSync(template_file, {encoding: 'utf-8'})
        while(file.includes('<Route>')) file = file.replace('<Route>', `${Name}`)
        while(file.includes('<route>')) file = file.replace('<route>', name)

        if(args.c){
          file = file.replace('@import_controllers', `@import_controllers\nimport { ${Name}Controller } from "@app/domains/${name}/${name}Controller"`)
          file = file.replace('@declare_controller', `@declare_controller\n  private controller: ${Name}Controller = new ${Name}Controller()`)
          file = file.replace('@routes', `@routes\n    { method: 'post', path: '/test', handler: this.controller.test , middleware: [] },`)
        }



        if(await !fs.existsSync(`${path}/${name}`)) await fs.mkdirSync(`${path}/${name}`)
        await fs.writeFileSync(`${path}/${name}/${name}Route.ts`, file )


        let index = await fs.readFileSync(`${process.cwd()}/src/app/router/index.ts`, {encoding: 'utf-8'})
        index = index.replace('@import_routes', `@import_routes\nimport { ${Name}Route } from '@app/domains/${name}/${name}Route'`)
        index = index.replace('@declare_routes', `@declare_routes\n  private ${name}Route: ${Name}Route`)
        index = index.replace('@assign_routes', `@assign_routes\n    this.${name}Route = new ${Name}Route(this.app, this.prefix)`)
        index = index.replace('@init_routes', `@init_routes\n      this.${name}Route.init()`)

        
        await fs.writeFileSync(`${process.cwd()}/src/app/router/index.ts`, index )

      }
      
      console.stop()
      process.exit()
      
    } else {
      const relative = '/src/seeders/'
      const path = `${process.cwd()}${relative}`
      if(typeof args.seeder === 'string'){
        const name = args.seeder
        const _name = args.seeder.replace('Seeder', '')
        console.log(console.text)
        const exists = await SeederModel.findOne({name: name}).lean()
        if(exists && !args.f){
          console.info(`Seeder ${console.paint.blue(_name)} already launched`)
          console.stop()
          process.exit()
        } else {
          console.info(`Launching seeder ${console.paint.blue(_name)}`)
          console.text = `${console.paint.blue(_name)}`
          try{
            const seeder = require(`${path}${name}`)
            console.start()
            const response = await seeder.run(args, console)
            console.stop()
            if(response){
              if(args.f && exists){
                await SeederModel.updateOne({_id: exists._id}, {name: name}, {upsert: true})
              } else {
                await SeederModel.create({name: name})
              }
              console.succeed(`Seeder ${console.paint.green(_name)} launched`)
            } else {
              console.fail(`Seeder ${console.paint.red(_name)} failed`)
            }
          } catch (error) {
            console.log('error', error)
            console.warn(`Seeder ${console.paint.yellow(_name)} aborted`)
          }
        }
        process.exit(0)
      } else if(args.x) {
        await runSeeders(console, args.f)
        process.exit(0)
      }
    }
  }
}

mongoose.connect(config.databases.mongo[config.mode].uri, {}).then(client)






