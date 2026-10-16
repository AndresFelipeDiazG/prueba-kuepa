import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const PermissionSchema = new Schema({
  app:{
    type: Schema.Types.String,
    required: true
  },
  content:{
    type: Schema.Types.String,
    required: true
  }
}, {
  collection: 'permissions', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

PermissionSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 


export const PermissionModel = mongoose.model<any, any>('Permission', PermissionSchema) 