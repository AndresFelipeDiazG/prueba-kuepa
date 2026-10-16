import { userService } from '@app/domains/user/userService'
import { Adnetwork, Campaign, Permission, Program, Role, Third, Tracking, User } from '@app/models'
import { ADMIN_ROLE, APP_NAME, PERMISSIONS } from '@app/resources/permissions'
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
         status: 'active',
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

    const permission = await Permission.findOneAndUpdate(
      { app: APP_NAME, content: PERMISSIONS.MANAGE_LEAD_STAGES },
      { $set: { app: APP_NAME, content: PERMISSIONS.MANAGE_LEAD_STAGES } },
      { upsert: true, new: true, lean: true },
    )

    const adminRole = await Role.findOneAndUpdate(
      { app: APP_NAME, name: ADMIN_ROLE },
      { $set: { app: APP_NAME, name: ADMIN_ROLE, permissions: [permission._id] } },
      { upsert: true, new: true, lean: true },
    )

    await User.updateOne(
      { username: adminUsername, 'homes.app': APP_NAME },
      { $addToSet: { 'homes.$.roles': adminRole._id } },
    )

    const programs = [
      'Auxiliar Administrativo',
      'Mercadeo y Ventas',
      'Procesamiento y Digitación de Datos',
      'Contabilidad y Finanzas',
      'Hotelería y Turismo',
      'Bachillerato acelerado',
    ]

    for (const name of programs) {
      await Program.findOneAndUpdate(
        { name },
        { $set: { name } },
        { upsert: true, new: true },
      )
    }

  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}
