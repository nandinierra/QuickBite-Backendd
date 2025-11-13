

import foodModel from "../model/food.model.js";


export const foodRoute=async (req, res) => {
    const data=await foodModel.insertMany(req.body); 
    res.status(201).json({
        message:data
    })

} 


export const getfooddetails=async (req, res)=>{
   const {type}=req.params;
   console.log(type)
    const items=await foodModel.find({category:type});
     res.status(201).json({
        food:items
     })
}


export const getpopularDishes= async (req, res)=>{
    const items=await foodModel.find({popular:true}).lean();
    res.status(201).json({
        food:items
    })
    

}


export const filterfood=async (req, res)=>{
    try{
      const {type, search}=req.query;

       const {category}=req.params;
       
      
      let filter={};
        filter.category=category;
      if(type&&type!="All"){  
        filter.type=type;
      }

      if(search && search.trim()!==""){
          filter.name = { $regex: search, $options: "i" };
      }

      if(type==="All"){
        const requireditems= await foodModel.find(filter);
       return  res.status(200).json({food:requireditems});
      }
      const requireditems= await foodModel.find(filter);
        res.status(200).json({food:requireditems}); 


    }catch(e){
         res.status(500).json({
            message:e
         })
    }
}



export const getfoodItem=async (req, res)=>{
     try{
      const {id}=req.params;
      console.log(id)
      const item=await foodModel.findById(id)
    
      res.status(200).json({
         food:item
      })
     }catch(error){
         res.status(500).json({
          message:error.message
         })
     }
}


