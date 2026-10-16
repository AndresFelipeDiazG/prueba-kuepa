import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

export interface ILead {
  incremental: number;
  number: string;
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
  mobile_phone: {type: Schema.Types.String},
  interestProgram: {type: Schema.Types.ObjectId, ref: 'Program'},
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


export const LeadModel = mongoose.model<ILead, any>('Lead', LeadSchema) 