import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const ProgramSchema = new Schema({
  name:{
    type: Schema.Types.String,
  },
  description:{
    type: Schema.Types.String,
  }
}, {
  collection: 'programs', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

ProgramSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const ProgramModel = mongoose.model<any, any>('Program', ProgramSchema) 