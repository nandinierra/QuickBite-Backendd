

import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors"; 
import route from "./route/route.js"
import {connectDb} from "./config/db.js";
import authRoute from "./route/auth.route.js";
import cookieParser from "cookie-parser"
import cartroute from "./route/cart.route.js";
import orderRoute from "./route/order.route.js";
const app=express(); 

const port=process.env.PORT || 3060;
const url=process.env.URL;


app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "https://quick-bite-frontend-ten.vercel.app"], 
  credentials: true,}  ));
app.use(express.json())
app.use(cookieParser()) 


app.get("/", (req, res)=>{
     res.status(201).json({
        message:"got the get request"
     })
})

app.post("/post", (req,res)=>{
    console.log(req.body)
    res.status(201).json({
        message:req.body
    })
})

app.use("/foodItems", route);
app.use("/auth", authRoute);
app.use("/cart", cartroute);
app.use("/orders", orderRoute);

connectDb(url);

app.listen(port, ()=>{
  console.log(`server is runnig on port ${port}`)
}) 

