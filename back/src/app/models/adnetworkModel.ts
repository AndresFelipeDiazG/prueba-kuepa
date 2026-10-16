import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const AdnetworkSchema = new Schema({
  name:{
    type: Schema.Types.String,
  },
  description:{
    type: Schema.Types.String,
  },
  display:{
    icon: {type: Schema.Types.String, default: '🎟️'}
  },
  status:{
    type: Schema.Types.String,
    enum: ['crafting', 'active', 'archived'],
    default: 'crafting'
  },
  defaults:{
    organic: {
      type: Schema.Types.Boolean,
    },
    manual: {
      type: Schema.Types.Boolean,
    }
  }
}, {
  collection: 'adnetworks', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

AdnetworkSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const AdnetworkModel = mongoose.model<any, any>('Adnetwork', AdnetworkSchema) 