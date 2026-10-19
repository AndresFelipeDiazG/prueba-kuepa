// @import_dependencies

// @import_models
import { Lead, Program, Third, User } from '@app/models'

// @import_utilities
import { responseUtility } from '@core/utilities/responseUtility'
import mongoose from 'mongoose'
import { validateContactInput } from '@app/domains/third/thirdValidation'

export interface IEmailFactory {
  accounts_config: any,
  third: string
  qty: number
}

const CONTACT_ORIGINS = ['website', 'facebook', 'instagram', 'whatsapp', 'referral', 'other']

const idOf = (value: any): string => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && value._id) return String(value._id)
  return ''
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

class ThirdService {
  public async ghost (_params:{brand:string, type:string}) {
    try {
      const third = await Third.findOne({
        brand: _params.brand,
        type: _params.type,
        $or: [{ first_name: 'New third' }],
      }).lean()

      if (third) return responseUtility.success({ object: third })

      const create = await Third.create({
        name: 'New third',
        first_name: 'New third',
        type: _params.type,
      })
      return responseUtility.success({ object: create.toObject() })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('third.save_error', null, { code: 500 })
    }
  }

  public async list (_params) {
    try {
      const where:any = {}
      if (_params.brand) where.brand = _params.brand
      where.type = _params.type || 'cli'
      if (_params.user) where.user = { $exists: true }

      const filters = String(_params.filters || _params.search || '').trim()
      if (filters) {
        const expression = { $regex: escapeRegex(filters), $options: 'i' }
        where.$or = [
          { first_name: expression },
          { last_name: expression },
          { full_name: expression },
          { document: expression },
          { number: expression },
          { email: expression },
          { city: expression },
          { department: expression },
          { tags: expression },
          { origin: expression },
        ]
      }
      if (_params.tag) where.tags = String(_params.tag).trim()
      if (_params.tags) {
        const tagList = String(_params.tags).split(',').map(tag => tag.trim()).filter(Boolean)
        if (tagList.length) where.tags = { $in: tagList }
      }

      const textFilter = (value: any) => ({ $regex: escapeRegex(String(value).trim()), $options: 'i' })
      for (const field of ['first_name', 'last_name', 'email', 'number', 'document']) {
        if (_params[field]) where[field] = textFilter(_params[field])
      }
      for (const field of ['document_type', 'origin', 'lead_status', 'department', 'educationLevel']) {
        if (_params[field]) where[field] = String(_params[field]).trim()
      }
      for (const field of ['responsible', 'interestProgram']) {
        if (_params[field] && mongoose.isValidObjectId(_params[field])) where[field] = _params[field]
      }
      if (_params.created_from || _params.created_to) {
        where.created_at = {}
        if (_params.created_from) where.created_at.$gte = new Date(String(_params.created_from))
        if (_params.created_to) {
          const to = new Date(String(_params.created_to))
          if (!Number.isNaN(to.getTime())) to.setHours(23, 59, 59, 999)
          where.created_at.$lte = to
        }
      }

      if (_params.status) where.status = _params.status

      const page = Math.max(1, Number.parseInt(String(_params.page || '1'), 10) || 1)
      const limit = Math.min(100, Math.max(1, Number.parseInt(String(_params.limit || '25'), 10) || 25))
      const [total, thirds, tags] = await Promise.all([
        Third.countDocuments(where),
        Third.find(where)
          .populate({ path: 'user', select: 'username', options: { lean: true } })
          .populate({ path: 'responsible', select: '_id username profile', options: { lean: true } })
          .populate({ path: 'interestProgram', select: '_id name description', options: { lean: true } })
          .populate({ path: 'trackings.tracking', select: '_id name description', options: { lean: true } })
          .populate({ path: 'notes.user', select: '_id username profile', options: { lean: true } })
          .sort({ created_at: -1, _id: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Third.distinct('tags', { type: where.type, deleted: { $ne: true } }),
      ])

      return responseUtility.success({
        list: thirds,
        tags: (tags || []).filter(Boolean).map(String).sort((a, b) => a.localeCompare(b)),
        pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('third.list_error', null, { code: 500 })
    }
  }

  public async get (_params) {
    try {
      const third = await Third.findOne({ _id: _params._id })
        .populate({ path: 'user', lean: true })
        .populate({ path: 'responsible', select: '_id username profile', options: { lean: true } })
        .populate({ path: 'interestProgram', select: '_id name description', options: { lean: true } })
        .populate({ path: 'trackings.tracking', select: '_id name description', options: { lean: true } })
        .populate({ path: 'notes.user', select: '_id username profile', options: { lean: true } })
        .lean()
      if (!third) return responseUtility.error('third.not_found', null, { code: 404 })

      const lead = third.type === 'cli'
        ? (await Lead.find({ contact: _params._id }).sort({ created_at: -1 }).lean().limit(1))[0]
        : undefined

      return responseUtility.success({ third, lead, interactions: [] })
    } catch (error) {
      console.log('error', error)
      return responseUtility.error('third.get_error', null, { code: 500 })
    }
  }

  private async validateCommercialReferences (contactData: any) {
    for (const field of ['responsible', 'interestProgram']) {
      if (contactData[field] && !mongoose.isValidObjectId(contactData[field])) return { [field]: 'La referencia no es válida' }
    }
    if (contactData.origin && !CONTACT_ORIGINS.includes(contactData.origin)) return { origin: 'El origen no es válido' }

    const [responsible, program] = await Promise.all([
      contactData.responsible ? User.findOne({ _id: contactData.responsible, status: 'active' }).select('_id').lean() : null,
      contactData.interestProgram ? Program.findOne({ _id: contactData.interestProgram }).select('_id').lean() : null,
    ])
    if (contactData.responsible && !responsible) return { responsible: 'El responsable no existe' }
    if (contactData.interestProgram && !program) return { interestProgram: 'El programa no existe' }
    return null
  }

  private leadFieldsFromContact (contact: any) {
    return {
      first_name: contact.first_name,
      last_name: contact.last_name,
      full_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      email: contact.email,
      mobile_phone: contact.number,
      document_type: contact.document_type,
      document: contact.document,
      tags: contact.tags || [],
      ...(contact.responsible ? { responsible: contact.responsible } : {}),
      ...(contact.origin ? { origin: contact.origin } : {}),
      ...(contact.interestProgram ? { interestProgram: contact.interestProgram } : {}),
      ...(contact.lead_status ? { status: contact.lead_status } : {}),
    }
  }

  public async upsert (_params) {
    try {
      if (!_params.type || _params.type === 'cli') {
        const validation = validateContactInput(_params)
        if (Object.keys(validation.errors).length > 0) {
          return responseUtility.error('third.invalid_contact', null, { code: 400, errors: validation.errors })
        }

        const contactData:any = {
          ...validation.value,
          type: 'cli',
          status: _params.status || 'active',
          full_name: `${validation.value.first_name} ${validation.value.last_name}`.trim(),
          mobile_phone: validation.value.number,
        }
        const referenceErrors = await this.validateCommercialReferences(contactData)
        if (referenceErrors) return responseUtility.error('third.invalid_contact', null, { code: 400, errors: referenceErrors })

        const duplicateWhere:any = {
          type: 'cli',
          $or: [
            { number: contactData.number },
            { document_type: contactData.document_type, document: contactData.document },
          ],
        }
        if (_params._id) {
          if (!mongoose.isValidObjectId(_params._id)) return responseUtility.error('third.invalid_contact', null, { code: 400, errors: { _id: 'El contacto no es válido' } })
          duplicateWhere._id = { $ne: _params._id }
        }

        const duplicate = await Third.findOne(duplicateWhere).select('number document_type document').lean()
        if (duplicate) {
          const errors: Record<string, string> = {}
          if (duplicate.number === contactData.number) errors.number = 'Ya existe un contacto con este teléfono'
          if (duplicate.document_type === contactData.document_type && duplicate.document === contactData.document) errors.document = 'Ya existe un contacto con este documento'
          return responseUtility.error('third.duplicate', null, { code: 409, errors })
        }

        if (_params._id) {
          // Campos opcionales que sí se pueden vaciar desde el formulario.
          const clearable = ['birthdate', 'city', 'department', 'educationLevel']
          const unset = clearable.filter(field => field in _params && !contactData[field])
          const update:any = { $set: contactData }
          if (unset.length) update.$unset = unset.reduce((acc:any, field) => ({ ...acc, [field]: '' }), {})
          const contact = await Third.findOneAndUpdate(
            { _id: _params._id, type: 'cli' },
            update,
            { new: true, lean: true, runValidators: true },
          )
          if (!contact) return responseUtility.error('third.not_found', null, { code: 404 })
          await Lead.updateMany({ contact: contact._id }, { $set: this.leadFieldsFromContact(contact) })
          return responseUtility.success({ object: contact })
        }

        const contact = await Third.create(contactData)
        return responseUtility.success({ object: contact.toObject() })
      }

      if (_params.type === 'sup' && _params.name) _params.first_name = _params.name
      if (_params._id) {
        const third = await Third.findOneAndUpdate({ _id: _params._id }, { $set: _params }, { lean: true, new: true })
        return responseUtility.success({ object: third })
      }
      const third = await Third.create({ location: { type: 'Point', coordinates: [0, 0] }, ..._params })
      return responseUtility.success({ object: third.toObject() })
    } catch (error:any) {
      if (error?.code === 11000) {
        const errors: Record<string, string> = {}
        if (error?.keyPattern?.number) errors.number = 'Ya existe un contacto con este teléfono'
        if (error?.keyPattern?.document_type || error?.keyPattern?.document) errors.document = 'Ya existe un contacto con este documento'
        return responseUtility.error('third.duplicate', null, { code: 409, errors })
      }
      console.log('error', error)
      return responseUtility.error('third.save_error', null, { code: 500 })
    }
  }

  public async addNote (_params) {
    try {
      const text = typeof _params.text === 'string' ? _params.text.trim() : ''
      if (!mongoose.isValidObjectId(_params._id) || !text || text.length > 2000) {
        return responseUtility.error('third.invalid_contact', null, { code: 400, errors: { text: 'La nota debe tener entre 1 y 2000 caracteres' } })
      }
      const note:any = { text, created_at: new Date() }
      if (mongoose.isValidObjectId(_params.user_logged)) note.user = _params.user_logged
      const contact = await Third.findOneAndUpdate(
        { _id: _params._id, type: 'cli' },
        { $push: { notes: note } },
        { new: true, lean: true },
      ).populate({ path: 'notes.user', select: '_id username profile', options: { lean: true } })
      if (!contact) return responseUtility.error('third.not_found', null, { code: 404 })
      return responseUtility.success({ object: contact })
    } catch (error) {
      console.log('Contact note error', error)
      return responseUtility.error('third.save_error', null, { code: 500 })
    }
  }

  public async delete (_params) {
    try {
      if (!mongoose.isValidObjectId(_params._id)) {
        return responseUtility.error('third.invalid_contact', null, { code: 400, errors: { _id: 'El contacto no es válido' } })
      }
      const contact = await Third.findOne({ _id: _params._id, type: 'cli' }).select('_id').lean()
      if (!contact) return responseUtility.error('third.not_found', null, { code: 404 })

      await Lead.deleteMany({ contact: _params._id })
      await Third.delete({ _id: _params._id })
      return responseUtility.success({ deleted: true })
    } catch (error) {
      console.log('Contact delete error', error)
      return responseUtility.error('third.delete_error', null, { code: 500 })
    }
  }

  public async test (_params) {
    try {
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const thirdService = new ThirdService()
export { ThirdService }
