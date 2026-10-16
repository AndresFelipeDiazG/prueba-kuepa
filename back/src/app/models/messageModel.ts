import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const MessageSchema = new Schema({
  number:{
    type: Schema.Types.String,
  },
  content:{
    type: Schema.Types.String,
  },
  context:[
    {
      type: Schema.Types.String,
    }
  ],
  inbound:{
    type: Schema.Types.Boolean,
  },
  type:{
    type: Schema.Types.String,
  },
  source:{
    type: Schema.Types.String,
  },
  from: { type: Schema.Types.String },
  to: { type: Schema.Types.String },
  metadata:{
    sid: {type: Schema.Types.String},
    profile: {type: Schema.Types.String},
  },
  location:{
    lat: { type: Schema.Types.String },
    lon: { type: Schema.Types.String },
  },
  attachment:{
    url:{
      type: Schema.Types.String
    },
    type: {
      type: Schema.Types.String
    }
  },
  _rel:{
    wid: { type: Schema.Types.String }
  },
  status:{
    type: Schema.Types.String
  },
  system:{
    processed:{
      type: Schema.Types.Boolean,
      default:false
    },
    ignore: { 
      type: Schema.Types.Boolean 
    },
    module:{
      type: Schema.Types.String,
      default: 'zenit',
      enum: ['zenit', 'callit']
    },
    artifact:{
      type: Schema.Types.String,
    },
    artifact_id:{
      type: Schema.Types.ObjectId,
    }
  },
  _ref:{
    contact:{
      type: Schema.Types.ObjectId,
      ref: 'Third'
    },
    lead:{
      type: Schema.Types.ObjectId,
      ref: 'Lead'
    },
    artifact: {
      type: Schema.Types.String
    },
    artifact_id: {
      type: Schema.Types.ObjectId
    },
  },
}, {
  collection: 'messages', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

MessageSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const MessageModel = mongoose.model<any, any>('Message', MessageSchema) 