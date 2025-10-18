

import jwt from "jsonwebtoken"

export const verifyUser=(req, res, next)=>{
   //  const token = req.cookies.token;
   const headers = req.headers.authorization
    const token = headers?.split(" ")[1]
    if(!token){
         return  res.status(401).json({
             message:"Token not found"
           })

    } 

   try{
      const decoded = jwt.verify(token, process.env.SECRETCODE) 
      console.log("decoded", decoded)
      req.user=decoded;
      next();
      
   }catch(error){
        return res.status(401).json({
            message:"Invalid or expired token"
         })
   }

}

