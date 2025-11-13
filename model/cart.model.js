
import mongoose from "mongoose";



const cartSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    foodItems:[
        {
             itemId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"foodItem"
             },
             quantity:{
                type:Number,
                required:true
             },
             size:{
                type:String,
             }

        }
    ]

})

export const CartModel=mongoose.model("Cart", cartSchema) 

