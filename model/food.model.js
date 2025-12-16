
import mongoose from "mongoose"; 

const foodSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    category:{
         type:String,
         required:true
    },
    type:{
      type:String,
      required:true
    },
    popular:{
        type:Boolean,
        required:true
    },
    description:{
        type:String
    },
    price:{
        regular:{type:Number, required:true},
        medium:{type:Number, required:true},
        large:{type:Number, required:true}
    },
    image:{
        type:String      
    },
    rating:{
        type:String
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    lastUpdatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    isActive:{
        type:Boolean,
        default:true
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
 

const foodModel= mongoose.model("foodItem", foodSchema);

export default foodModel; 
