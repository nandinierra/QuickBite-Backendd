import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"; 
import UserModel from "../model/user.model.js"; 
import {z} from "zod";

const ROLE_PERMISSIONS = {
  customer: ["read_food"],
  admin: ["read_food", "create_food", "update_food", "delete_food", "manage_users", "view_orders", "manage_orders"]
};

export async function registerUser(req, res){
    
    const {name, email, password, role, adminSecretKey}= req.body;
    const UserRules=z.object({
        name:z.string().min(5).max(20),
        email:z.email(),
        password:z.string().min(4).max(12),
        role:z.enum(["customer", "admin"]).optional(),
        adminSecretKey:z.string().optional()
    });
    
    const result=UserRules.safeParse({name, email, password, role, adminSecretKey});
    
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
            return res.status(400).json({
                message:"user already exists"
            })
        }
        
        const userRole = role || "customer";
        
        if(userRole === "admin"){
            const correctAdminSecret = process.env.ADMIN_SECRET_KEY;
            if(!adminSecretKey || adminSecretKey.trim() === ""){
                return res.status(400).json({
                    message:"Admin secret key is required for admin registration"
                })
            }
            if(adminSecretKey !== correctAdminSecret){
                return res.status(403).json({
                    message:"Invalid admin secret key"
                })
            }
        }
        
        const hashedPassword=await bcrypt.hash(password, 10);
        const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;
        
        const newUser=await UserModel.create({
            name, 
            email,
            password:hashedPassword,
            role: userRole,
            permissions: permissions,
            isActive: true
        });
        
        res.status(201).json({
            message:"User registered successfully",
            user:{
                _id:newUser._id,
                name:newUser.name,
                email:newUser.email,
                role:newUser.role,
                permissions:newUser.permissions
            }
        })
    }catch(e){
        res.status(500).json({
            message:e.message || "Registration failed"
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
        
        if(!existingUser.isActive){
            return res.status(403).json({
                message:"Account is inactive. Contact administrator."
            })
        }
        
        const isPasswordValid  = await bcrypt.compare(password, existingUser.password);
        if(!isPasswordValid ){
           return res.status(400).json({
                message:"wrong password"
            })
        }
        
        const secretCode=process.env.SECRETCODE;
        const payload={
            _id:existingUser._id.toString(),
            email:existingUser.email,
            role:existingUser.role,
            permissions:existingUser.permissions
        }
       const jwtToken = jwt.sign(payload, secretCode, {expiresIn:"30d"})

       await UserModel.findByIdAndUpdate(existingUser._id, {lastLogin: new Date()}, {new:true})
       
        return res.status(200).json({
           token:jwtToken,
           user:{
               _id:existingUser._id,
               name:existingUser.name,
               email:existingUser.email,
               role:existingUser.role,
               permissions:existingUser.permissions
           }
       })
     }catch(e){
        return res.status(500).json({
            message:e.message || "Login failed"
         })
     }
 
}

export const finalRes=(req, res)=>{
    res.status(200).json({
       message:"Valid User",
       user:{
           _id:req.user._id,
           email:req.user.email,
           role:req.user.role,
           permissions:req.user.permissions
       }
    })
}
