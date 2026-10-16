import config from 'config'
import mongoose from 'mongoose'


class DataBaseUtility {

  public redis_con
  public mongo_con
  public static instance: DataBaseUtility
  
  constructor () { }
  
  public static getInstance(): DataBaseUtility {
    if (!DataBaseUtility.instance) {
      DataBaseUtility.instance = new DataBaseUtility();
    }
    return DataBaseUtility.instance; 
  }

  public retry_strategy_redis = (options) => {
    if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
      // Try reconnecting after 5 seconds
      console.error('The server refused the connection. Retrying connection...');
      if (options.attempt < 3) return 5000;
      else return undefined
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with an individual error
      return false
    }
    if (options.attempt > 3) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  }

  public connectMongo = async () => {
    try{
      this.mongo_con = await mongoose.connect(config.databases.mongo[config.mode].uri, {})
      console.log(`Mongo contented`)
    } catch (error) {
      console.log('error', error)
    }
  }
}

const databaseUtility = DataBaseUtility.getInstance();
export { DataBaseUtility, databaseUtility }