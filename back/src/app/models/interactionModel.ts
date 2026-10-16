import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const InteractionSchema = new Schema({
  target:{
    type: Schema.Types.String,
    enum: ['human', 'machine'],
    default: 'human'
  },
  number:{
    type: Schema.Types.String,
    required: true
  },
  messages:[
    {
      type: Schema.Types.ObjectId, ref: 'Message'
    }
  ],
  last_inbound:{
    type: Schema.Types.Date
  },
  source:{
    type: Schema.Types.String,
    enum: ['human', 'machine'],
    default: 'human'
  },
  scope:{
    type: Schema.Types.String,
    enum: ['lead', 'contact'],
    default: 'lead'
  },
  type:{
    type: Schema.Types.String,
    enum: ['whatsapp', 'form', 'email', 'sms', 'callit'],
  },
  status:{
    type: Schema.Types.String,
    enum: ['active', 'ended'],
    default: 'active'
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
    adviser:{
      type: Schema.Types.ObjectId,
      ref: 'Third'
    }
  }
}, {
  collection: 'interactions', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

InteractionSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const InteractionModel = mongoose.model<any, any>('Interaction', InteractionSchema) 