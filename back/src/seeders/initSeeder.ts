import { userService } from '@app/domains/user/userService'
import { Adnetwork, Campaign, Third, Tracking, User } from '@app/models'
import { IConsole } from '@client/client'
import config from 'config'

export const run = async(_params, console:IConsole) => {
  try{
    const adminUsername = process.env.SEED_ADMIN_USERNAME
    const adminPassword = process.env.SEED_ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      throw new Error('SEED_ADMIN_USERNAME and SEED_ADMIN_PASSWORD are required')
    }
    
    
    const users = [
      {
        username: adminUsername,
        password: adminPassword,
        number: '000000',
        profile:{
          first_name: 'Kuepa', 
          last_name: ''
        },
        homes:[
          {
            app:"kuepa",
            roles: [],
            current: true,
          },
        ]
      },
    ]
    
    for (const user of users) {
      const exists = await User.findOne({username: user.username}).lean()
      if(exists){
        user['_id'] = exists._id
        const update = await User.updateOne({_id: exists._id}, {$set: user})
        user['merge_homes'] = true
      } 
      await userService.upsert(user)
    }
  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}
