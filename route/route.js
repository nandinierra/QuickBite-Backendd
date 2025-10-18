

import {Router} from "express" 
import  {foodRoute, getfooddetails, filterfood, getfoodItem, getpopularDishes} from "../controller/foodcontroller.js"



const route=Router();



route.post("/post", foodRoute);
route.get("/popular/get", getpopularDishes);
route.get("/get/:category", getfooddetails);
route.get("/getItemId/:id", getfoodItem);
route.get('/filter/:category', filterfood);




export default route 

