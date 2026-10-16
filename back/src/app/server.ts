import { App } from '@app/app'
import config from 'config'

while (!process.cwd().endsWith(config.root)){
  process.chdir('../')
}


const app = new App()

app.init()

