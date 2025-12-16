
import mongoose from "mongoose";

const userSchema  = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  password:{
    type:String,
    required:true
  },
  role:{
    type:String,
    enum:["customer", "admin", "moderator"],
    default:"customer"
  },
  permissions:[{
    type:String,
    enum:["read_food", "create_food", "update_food", "delete_food", "manage_users", "view_orders", "manage_orders"]
  }],
  isActive:{
    type:Boolean,
    default:true
  },
  lastLogin:{
    type:Date,
    default:null
  },
  createdAt:{
    type:Date,
    default:Date.now
  },
  updatedAt:{
    type:Date,
    default:Date.now
  }
}) 

const UserModel = mongoose.model("user", userSchema) 
export default UserModel;