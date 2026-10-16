import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 
import { DOCUMENT_TYPES, LEAD_ORIGINS, DocumentType, LeadOrigin } from '@app/domains/lead/leadTypes'


const { Schema } = mongoose 

export interface ILead {
  incremental?: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_phone?: string;
  document_type?: DocumentType;
  document?: string;
  contact?: mongoose.Types.ObjectId;
  responsible?: mongoose.Types.ObjectId;
  origin?: LeadOrigin;
  tags?: string[];
  interestProgram?: mongoose.Types.ObjectId;
  stage?: mongoose.Types.ObjectId;
  status?: 'active' | 'inactive';
}

const LeadSchema = new Schema({
  incremental:{
    //numero unico de 4 digitos 
    type: Schema.Types.Number,
  },
  full_name: {type: Schema.Types.String},
  first_name: {type: Schema.Types.String},
  last_name: {type: Schema.Types.String},
  email: {type: Schema.Types.String},
  mobile_phone: {
    type: Schema.Types.String,
    trim: true,
    match: /^\d{10}$/,
  },
  document_type: {
    type: Schema.Types.String,
    enum: DOCUMENT_TYPES,
  },
  document: {
    type: Schema.Types.String,
    trim: true,
    match: /^\d{4,20}$/,
  },
  contact: {type: Schema.Types.ObjectId, ref: 'Third'},
  responsible: {type: Schema.Types.ObjectId, ref: 'User'},
  origin: {
    type: Schema.Types.String,
    enum: LEAD_ORIGINS,
  },
  tags: [{type: Schema.Types.String, trim: true}],
  interestProgram: {type: Schema.Types.ObjectId, ref: 'Program'},
  stage: {type: Schema.Types.ObjectId, ref: 'LeadStage'},
  status:{
    type: Schema.Types.String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  trackings: [
    {
        tracking: {type: Schema.Types.ObjectId, ref: 'Tracking'},
        description: {type: Schema.Types.String},
    }
  ]
}, {
  collection: 'leads', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

LeadSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 

LeadSchema.index(
  { mobile_phone: 1 },
  {
    unique: true,
    partialFilterExpression: { mobile_phone: { $type: 'string' } },
  },
)

LeadSchema.index(
  { document_type: 1, document: 1 },
  {
    unique: true,
    partialFilterExpression: {
      document_type: { $type: 'string' },
      document: { $type: 'string' },
    },
  },
)


export const LeadModel = mongoose.model<ILead, any>('Lead', LeadSchema)
