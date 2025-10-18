import mongoose from "mongoose";

export async function connectDb(url){
   mongoose.connect(url);
   console.log("mongodb connected");
}
