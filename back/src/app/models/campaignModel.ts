import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const CampaignSchema = new Schema({
  name:{
    type: Schema.Types.String,
  },
  description:{
    type: Schema.Types.String,
  },
  display:{
    icon: {type: Schema.Types.String, default: '📊'}
  },
  status:{
    type: Schema.Types.String,
    enum: ['crafting', 'active', 'archived'],
    default: 'crafting'
  },
  users:[
    {
      third: {
        type: Schema.Types.ObjectId,  
        ref: 'Third',
      },
      adnetworks:[
        { 
          type: Schema.Types.ObjectId,
          ref: 'Adnetwork',
        }
      ]
    }
  ]
}, {
  collection: 'campaigns', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

CampaignSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const CampaignModel = mongoose.model<any, any>('Campaign', CampaignSchema) 