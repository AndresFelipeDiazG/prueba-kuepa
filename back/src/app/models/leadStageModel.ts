import mongoose_delete from 'mongoose-delete'
import mongoose from 'mongoose'

const { Schema } = mongoose

export type LeadStageStatus = 'active' | 'archived'

export interface ILeadStage {
  name: string
  key: string
  color: string
  order: number
  status: LeadStageStatus
}

const LeadStageSchema = new Schema<ILeadStage>({
  name: {
    type: Schema.Types.String,
    required: true,
    trim: true,
  },
  key: {
    type: Schema.Types.String,
    required: true,
    trim: true,
    lowercase: true,
  },
  color: {
    type: Schema.Types.String,
    required: true,
  },
  order: {
    type: Schema.Types.Number,
    required: true,
    min: 1,
  },
  status: {
    type: Schema.Types.String,
    enum: ['active', 'archived'],
    default: 'active',
  },
}, {
  collection: 'lead_stages',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})

LeadStageSchema.index({ key: 1 }, { unique: true })

LeadStageSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all',
})

export const LeadStageModel = mongoose.model<ILeadStage, any>('LeadStage', LeadStageSchema)
