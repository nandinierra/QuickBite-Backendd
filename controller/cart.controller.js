
import { CartModel } from "../model/cart.model.js";





export async function addToCart(req,res){
   const user = req.user 
   console.log("user", user)
   const userId = user._id
  
   
   try{
    const {itemId,quantity,size} = req.body
     const cart = await CartModel.findOne({userId})

     if(!cart){
        const item = await CartModel.create({userId,foodItems:[{itemId,quantity,size}]})
        res.status(201).json({message : "Your Item has added to the cart successfully."})
     }
     else{
        const existingItem =  cart.foodItems.find(i => i.itemId.toString() === itemId)
        if(!existingItem){
            cart.foodItems.push({itemId,quantity,size})
            res.status(200).json({message : "Your Item has added to the cart successfully."})
        }
        else{
            existingItem.quantity += 1 ;
              if (size && existingItem.size !== size) {
                existingItem.size = size;
              }
            res.status(200).json({message : "Quantity updated successfully"})
        }
        await cart.save();
     }
   }
   catch(e){
    res.status(400).json({message : e})
   }
}


export async function getCartItems(req,res){
  try{
    const userId = req.user._id 
    console.log(userId)
    const data = await CartModel.findOne({userId}).populate("foodItems.itemId")
    res.status(200).json(data)
  }
  catch(e){
    res.status(400).json({message : e})
  }
}




export async function updateCartItem(req,res){
  const {action} = req.body
  const userId = req.user._id
  try{
    const {itemId} = req.params
    const userItem = await CartModel.findOne({userId})
    if(!userItem){
       return res.status(400).json({message:"Cart not found for this user"})
    }
    else{
      const items = userItem.foodItems.find(i => i.itemId.toString() === itemId )
      if(!items){
        return res.status(400).json({message : "Product not found"})
      }
      else{
        if(action === "increase"){
           items.quantity += 1 
        }
        else if(items.quantity > 1){
            items.quantity -= 1 
        }
      }
      await userItem.save()
      return res.status(200).json({message : "Cart has updated"})
    }
  }
  catch(e){
    res.status(400).json({message:e})
  }
}

export async function deleteCartItem(req,res){

 try{
   const userId = req.user._id 
   const {itemId} = req.params
   const userItem = await CartModel.findOne({userId})
   if(!userItem){
    return res.status(400).json({message:"Cart not found"})
   }
    userItem.foodItems.pull({ itemId }); 
    await userItem.save();
   return res.status(200).json({ message: "Product removed from cart" });
 }
 catch(e){
    res.status(400).json({message:e})
 }
}

export async function clearCart(req,res){
  try {
     const userId = req.user._id 
    const clearedProducts = await CartModel.deleteOne({userId})
    res.status(200).json({message:"Cleared the cart successfully ..."})
  }
  catch(e){
    res.status(400).json({message:e})
  }
}

