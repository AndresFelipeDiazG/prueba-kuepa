import { userService } from '@app/domains/user/userService'
import { Adnetwork, Campaign, Lead, Permission, Program, Role, Third, Tracking, User } from '@app/models'
import { ADMIN_ROLE, APP_NAME, PERMISSIONS } from '@app/resources/permissions'
import { IConsole } from '@client/client'
import config from 'config'

const contactDataFromLead = (lead:any) => ({
  type: 'cli',
  status: 'active',
  first_name: lead.first_name || '',
  last_name: lead.last_name || '',
  full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
  email: lead.email || '',
  ...(lead.mobile_phone ? { number: lead.mobile_phone, mobile_phone: lead.mobile_phone } : {}),
  ...(lead.document_type ? { document_type: lead.document_type } : {}),
  ...(lead.document ? { document: lead.document } : {}),
  ...(lead.incremental !== undefined ? { incremental: lead.incremental } : {}),
  ...(lead.responsible ? { responsible: lead.responsible } : {}),
  ...(lead.origin ? { origin: lead.origin } : {}),
  tags: lead.tags || [],
  ...(lead.interestProgram ? { interestProgram: lead.interestProgram } : {}),
  ...(lead.status ? { lead_status: lead.status } : {}),
  ...(lead.trackings?.length ? { trackings: lead.trackings } : {}),
})

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

    const legacyLeads = await Lead.find({
      $or: [
        { contact: { $exists: false } },
        { contact: null },
      ],
    }).lean()

    for (const lead of legacyLeads) {
      const matches: any[] = []
      if (lead.mobile_phone) matches.push({ number: lead.mobile_phone })
      if (lead.document_type && lead.document) matches.push({ document_type: lead.document_type, document: lead.document })

      let contact = matches.length > 0
        ? await Third.findOne({ type: 'cli', $or: matches })
        : null

      const contactData = contactDataFromLead(lead)

      if (contact) {
        await Third.updateOne({ _id: contact._id }, { $set: contactData })
      } else {
        contact = await Third.create(contactData)
      }

      await Lead.updateOne({ _id: lead._id }, { $set: { contact: contact._id } })
    }

    const linkedLeads = await Lead.find({ contact: { $exists: true, $ne: null } }).sort({ created_at: 1 }).lean()
    for (const lead of linkedLeads) {
      await Third.updateOne({ _id: lead.contact }, { $set: contactDataFromLead(lead) })
    }

  } catch (error) {
    console.log('error', error)
    return false
  }
  return true
}
