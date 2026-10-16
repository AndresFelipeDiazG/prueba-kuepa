import mongoose from 'mongoose'
import { Lead, LeadStage } from '@app/models'
import { responseUtility } from '@core/utilities/responseUtility'
import {
  canArchiveStage,
  createStageKey,
  isValidStageColor,
  isValidStageOrder,
  normalizeStageName,
  validateStageName,
} from '@app/domains/lead/leadStageRules'

class LeadStageService {
  public async list (_params: { include_archived?: string | boolean }) {
    try {
      const includeArchived = _params.include_archived === true || _params.include_archived === 'true'
      const where = includeArchived ? {} : { status: 'active' }
      const list = await LeadStage.find(where).sort({ order: 1, name: 1 }).lean()

      return responseUtility.success({ list })
    } catch (error) {
      console.error('Lead stage list error', error)
      return responseUtility.error('lead_stage.list_error', null, { code: 500 })
    }
  }

  public async upsert (_params: {
    _id?: string
    name?: string
    color?: string
    order?: number
  }) {
    try {
      const name = normalizeStageName(_params.name || '')
      const nameError = validateStageName(name)
      if (nameError) {
        return responseUtility.error('lead_stage.invalid_name', null, {
          code: 400,
          details: nameError,
        })
      }

      const color = (_params.color || '').trim()
      if (!isValidStageColor(color)) {
        return responseUtility.error('lead_stage.invalid_color', null, { code: 400 })
      }

      if (!isValidStageOrder(_params.order)) {
        return responseUtility.error('lead_stage.invalid_order', null, { code: 400 })
      }

      const key = createStageKey(name)
      const data = { name, key, color, order: _params.order }

      if (_params._id) {
        if (!mongoose.isValidObjectId(_params._id)) {
          return responseUtility.error('lead_stage.not_found', null, { code: 404 })
        }

        const stage = await LeadStage.findOneAndUpdate(
          { _id: _params._id },
          { $set: data },
          { new: true, lean: true, runValidators: true },
        )

        if (!stage) return responseUtility.error('lead_stage.not_found', null, { code: 404 })

        return responseUtility.success({ object: stage })
      }

      const stage = await LeadStage.create(data)
      return responseUtility.success({ object: stage.toObject() }, 201)
    } catch (error: any) {
      if (error?.code === 11000) {
        return responseUtility.error('lead_stage.key_already_exists', null, { code: 409 })
      }

      console.error('Lead stage upsert error', error)
      return responseUtility.error('lead_stage.upsert_error', null, { code: 500 })
    }
  }

  public async archive (_params: { _id?: string }) {
    try {
      if (!_params._id || !mongoose.isValidObjectId(_params._id)) {
        return responseUtility.error('lead_stage.not_found', null, { code: 404 })
      }

      const stage = await LeadStage.findOne({ _id: _params._id })
      if (!stage) return responseUtility.error('lead_stage.not_found', null, { code: 404 })
      if (stage.status === 'archived') return responseUtility.success({ object: stage.toObject() })

      const activeCount = await LeadStage.countDocuments({ status: 'active' })
      if (!canArchiveStage(activeCount)) {
        return responseUtility.error('lead_stage.last_active', null, { code: 409 })
      }

      const leadsCount = await Lead.countDocuments({ stage: stage._id, status: 'active' })
      if (leadsCount > 0) {
        return responseUtility.error('lead_stage.has_leads', null, { code: 409 })
      }

      stage.status = 'archived'
      await stage.save()

      return responseUtility.success({ object: stage.toObject() })
    } catch (error) {
      console.error('Lead stage archive error', error)
      return responseUtility.error('lead_stage.archive_error', null, { code: 500 })
    }
  }
}

export const leadStageService = new LeadStageService()
export { LeadStageService }
