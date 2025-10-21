
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"; 
import UserModel from "../model/user.model.js"; 
import {z} from "zod";



export async function registerUser(req, res){
    
    const {name, email, password}= req.body;
     const UserRules=z.object({
        name:z.string().min(5).max(20),
        email:z.email(),
        password:z.string().min(4).max(12)
        }) 
         //validating the above rules
         const result=UserRules.safeParse({name, email, password})
     
         //if input validation fails then send the below validations
         if(!result.success){
             res.status(400).json({
                 message:"Check the Input",
                 error:result.error
             })
             return;
        }
         


    try{
        const existingUser=await UserModel.findOne({email});
        if(existingUser){
          return  res.status(400).json({
                message:"user already exists"
            })
        }
            const hashedPassword=await bcrypt.hash(password, 10); 
            const newUser=await UserModel.create({
                name, 
                email,
                password:hashedPassword
             })
             res.status(201).json({
                message:newUser
             })
    }catch(e){
        res.status(500).json({
            message:e
        })
    }


}






export async function loginUser(req, res){ 

     const {email, password}=req.body; 
     try{
        const existingUser=await UserModel.findOne({email});
        if (!email || !password || email.trim() === "" || password.trim() === ""){
              return res.status(400).json({
                message:"enter valid credentials"
            })
        }
        if(!existingUser){
            return res.status(400).json({
                message:"user with this email not found"
            })
        }
        const isPasswordValid  = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordValid ){
           return res.status(400).json({
                message:"wrong password"
            })
        }
        else{
            const secretCode=process.env.SECRETCODE;
            console.log("existingUser", existingUser._id)
            const payload={
                _id:existingUser._id.toString(),
                email:existingUser.email, 
            }
            console.log("payload", payload)
           const jwtToken = jwt.sign(payload, secretCode, {expiresIn:"30d"})

           
            return res.status(200).json({
               token:jwtToken
           })
        }
     }catch(e){
        return res.status(500).json({
            message:e
         })
     }
 


}

export const finalRes=(req, res)=>{
    res.status(200).json({
       message:"Valid User"
    })
}


