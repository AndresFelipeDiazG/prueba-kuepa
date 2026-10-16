import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const SeederSchema = new Schema({
  name: { type: String, required: true },
}, {
  collection: 'seeders', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

SeederSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all'
}) 


export const SeederModel = mongoose.model<any, any>('Seeder', SeederSchema) 