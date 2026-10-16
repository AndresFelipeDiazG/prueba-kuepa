import mongoose_delete from "mongoose-delete" 
import mongoose from 'mongoose' 


const { Schema } = mongoose 

const UserSchema = new Schema({
  number: { type: Schema.Types.String, required: true },
  username:{
    type: Schema.Types.String,
  },
  password:{
    type: Schema.Types.String,
  },
  profile: {
    first_name: { type: Schema.Types.String },
    last_name: { type: Schema.Types.String },
    avatar: { type: Schema.Types.String },
  },
  plan: { type: Schema.Types.String, default: 'free' },
  last_login: { type: Schema.Types.Date },
  homes:[
    {
      app: { type: Schema.Types.String },
      roles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
      permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
      current:  { type: Schema.Types.Boolean, default: false },
      resources: [
        {
          model: { type: Schema.Types.String },
          model_id: { type: Schema.Types.ObjectId },
        }
      ]
    }
  ],
  addresses:[
    {
      address: { type: Schema.Types.String },
      city: { type: Schema.Types.String },
      state: { type: Schema.Types.String },
      zip: { type: Schema.Types.String },
      country: { type: Schema.Types.String },
      directions: { type: Schema.Types.String },
      to: { type: Schema.Types.String },
      last_used: { type: Schema.Types.Date },
    }
  ],
  system:{
    needs_password_reset: { type: Schema.Types.Boolean, default: false },
  },
  status:{
    type: Schema.Types.String,
    enum: ['crafting', 'active', 'archived'],
    default: 'crafting'
  },
}, {
  collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

UserSchema.virtual('full_name').get(function() {
  return `${this.profile?.first_name? this.profile.first_name:''} ${this.profile?.last_name? this.profile.last_name:''}`.trim()
});

UserSchema.plugin(mongoose_delete, {
  deletedAt: true,
  overrideMethods: 'all',
  indexFields: 'all' 
}) 

export const UserModel = mongoose.model<any, any>('User', UserSchema) 