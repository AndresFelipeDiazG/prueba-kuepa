import dotenv from 'dotenv'

dotenv.config()

const requiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

const mongoUri = requiredEnvironmentVariable('MONGO_URI')
const jwtSecret = requiredEnvironmentVariable('JWT_SECRET')

export default {
  root: 'back',
  mode: 'dev',
  customs:{
    url: process.env.PUBLIC_URL || 'http://localhost:7001',
  },
  databases: {
    mongo:{
      dev: {
        uri: mongoUri
      }
    }
  },
  jwt: jwtSecret,
  port: Number(process.env.PORT || 7001),
  public_url: process.env.PUBLIC_URL || 'http://localhost:7001'
}
