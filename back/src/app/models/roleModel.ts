import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const RoleSchema = new Schema({
  name:{
    type: Schema.Types.String,
    required: true
  },
  app:{
    type: Schema.Types.String,
    required: true
  },
  permissions:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Permission'
    }
  ]
}, {
  collection: 'roles', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

RoleSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const RoleModel = mongoose.model<any, any>('Role', RoleSchema) 