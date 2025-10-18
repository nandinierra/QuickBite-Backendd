


import { Router } from "express";
import { addToCart,getCartItems,updateCartItem,deleteCartItem,clearCart } from "../controller/cart.controller.js";
import { verifyUser } from "../middleware/auth.js";
const cartroute = Router()

cartroute.get("/getItems",verifyUser,getCartItems)
cartroute.post("/addItem",verifyUser,addToCart)
cartroute.put("/update/:itemId",verifyUser,updateCartItem)
cartroute.delete("/deleteItem/:itemId",verifyUser,deleteCartItem)
cartroute.delete("/clear",verifyUser,clearCart)

export default cartroute


