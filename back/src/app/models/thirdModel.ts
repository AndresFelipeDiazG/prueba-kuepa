import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 

export interface IThird {
  incremental?: number;
  number?: string;
  mobile_phone?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  document_type?: 'cc' | 'ti' | 'pp' | 'nt';
  document?: string;
  responsible?: mongoose.Types.ObjectId;
  origin?: 'website' | 'facebook' | 'instagram' | 'whatsapp' | 'referral' | 'other';
  tags?: string[];
  interestProgram?: mongoose.Types.ObjectId;
  lead_status?: 'active' | 'inactive';
  trackings?: Array<{ tracking?: mongoose.Types.ObjectId; description?: string }>;
  notes?: Array<{ text: string; created_at?: Date; user?: mongoose.Types.ObjectId }>;
  type?: 'cli' | 'emp' | 'sup';
  status?: 'crafting' | 'active' | 'archived';
}

const { Schema } = mongoose 

const ThirdSchema = new Schema({
  incremental:{
    type: Schema.Types.Number,
  },
  full_name:{
    type: Schema.Types.String,
  },
  name:{
    type: Schema.Types.String,
  },
  first_name:{
    type: Schema.Types.String,
  },
  last_name:{
    type: Schema.Types.String,
  },
  area:{
    type: Schema.Types.String,
  },
  avatar:{
    type: Schema.Types.String,
  },
  display:{
    icon: {type: Schema.Types.String, default: '👤'}
  },
  document_type:{
    type: Schema.Types.String,
    enum: ['cc', 'ti', 'pp', 'nt']
  },
  document:{
    type: Schema.Types.String,
  },
  tags: [{ type: Schema.Types.String, trim: true }],
  responsible: { type: Schema.Types.ObjectId, ref: 'User' },
  origin: {
    type: Schema.Types.String,
    enum: ['website', 'facebook', 'instagram', 'whatsapp', 'referral', 'other'],
  },
  interestProgram: { type: Schema.Types.ObjectId, ref: 'Program' },
  lead_status: {
    type: Schema.Types.String,
    enum: ['active', 'inactive'],
  },
  mobile_phone: {
    type: Schema.Types.String,
    trim: true,
    match: /^\d{10}$/,
  },
  trackings: [
    {
      tracking: { type: Schema.Types.ObjectId, ref: 'Tracking' },
      description: { type: Schema.Types.String },
    },
  ],
  notes: [
    {
      text: { type: Schema.Types.String, required: true, trim: true, maxlength: 2000 },
      created_at: { type: Schema.Types.Date, default: Date.now },
      user: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  third_type:{
    type: Schema.Types.String,
    enum: ['nt', 'co']
  },
  type:{
    type: Schema.Types.String,
    enum: ['cli', 'emp', 'sup']
  },
  number:{
    type: Schema.Types.String,
    trim: true,
    match: /^\d{10}$/,
  },
  email:{
    type: Schema.Types.String,
  },
  status:{
    type: Schema.Types.String,
    enum: ['crafting', 'active', 'archived'],
    default: 'crafting'
  },
  fields:[
    {
      label: {
        type: Schema.Types.String
      },
      value: {
        type: Schema.Types.String
      },
    }
  ],
  channels:[
    {
      type:{
        type: Schema.Types.String,
        enum: ['email', 'number', 'domain']
      },
      value:{
        type: Schema.Types.String
      },
      label:{
        type: Schema.Types.String
      },
      favorite:{
        type: Schema.Types.Boolean
      }
    }
  ],
  party: {
    type: Schema.Types.ObjectId,
    ref: 'Third'
  },
  user:{
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  online:{
    type: Schema.Types.Date
  }
}, {
  collection: 'thirds', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ThirdSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 

ThirdSchema.index(
  { number: 1 },
  {
    unique: true,
    partialFilterExpression: { type: 'cli', number: { $type: 'string' } },
  },
)

ThirdSchema.index(
  { document_type: 1, document: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'cli',
      document_type: { $type: 'string' },
      document: { $type: 'string' },
    },
  },
)

export const ThirdModel = mongoose.model<any, any>('Third', ThirdSchema)
