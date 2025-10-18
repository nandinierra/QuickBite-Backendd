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
    }


})
 

const foodModel= mongoose.model("foodItem", foodSchema);

export default foodModel; 
