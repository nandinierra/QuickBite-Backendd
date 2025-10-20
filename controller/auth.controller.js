
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"; 
import UserModel from "../model/user.model.js"; 



export async function registerUser(req, res){
    
    const {name, email, password}=   req.body;
    try{
        const existingUser=await UserModel.findOne({name, email});
        if(existingUser){
            res.status(400).json({
                message:"user already exists"
            })
        }

        else{
            const hashedPassword=await bcrypt.hash(password, 10); 
            const newUser=await UserModel.create({
                name, 
                email,
                password:hashedPassword
             })
             res.status(200).json({
                message:newUser
             })


        }

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
        if (email==="" || password===""){
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


