import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 

export interface IThird {
  incremental: number;
  number: string;
  first_name: string;
  last_name: string;
}

const { Schema } = mongoose 

const ThirdSchema = new Schema({
  incremental:{
    type: Schema.Types.Number,
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

ThirdSchema.virtual('full_name').get(function() {
  return `${this?.first_name? this.first_name:''} ${this?.last_name? this.last_name:''}`.trim()
})

ThirdSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const ThirdModel = mongoose.model<any, any>('Third', ThirdSchema) 