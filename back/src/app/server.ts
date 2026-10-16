import { App } from '@app/app'
import path from 'node:path'

const backendRoot = path.resolve(__dirname, '../..')
if (process.cwd() !== backendRoot) {
  process.chdir(backendRoot)
}

const app = new App()

app.init()

