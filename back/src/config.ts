import dotenv from 'dotenv'

dotenv.config()

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kuepa_test?retryWrites=true&w=majority&appName=Test'

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
  jwt: process.env.JWT_SECRET || 'local-development-secret-change-me',
  port: Number(process.env.PORT || 7001),
  public_url: process.env.PUBLIC_URL || 'http://localhost:7001'
}
