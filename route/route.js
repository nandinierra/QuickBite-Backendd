import {Router} from "express"
import {
  foodRoute,
  getfooddetails,
  filterfood,
  getfoodItem,
  getpopularDishes,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getAllFoodItems,
  getActiveFoodItems,
  deactivateFoodItem,
  reactivateFoodItem
} from "../controller/foodcontroller.js"
import { verifyUser, verifyAdmin, verifyPermission } from "../middleware/auth.js"

const route = Router();

route.post("/post", foodRoute);

route.get("/popular/get", getpopularDishes);
route.get("/get/:category", getfooddetails);
route.get("/getItemId/:id", getfoodItem);
route.get("/filter/:category", filterfood);
route.get("/active/all", getActiveFoodItems);

route.post("/admin/create", verifyUser, verifyAdmin, createFoodItem);
route.put("/admin/update/:id", verifyUser, verifyAdmin, updateFoodItem);
route.delete("/admin/delete/:id", verifyUser, verifyAdmin, deleteFoodItem);
route.get("/admin/all", verifyUser, verifyAdmin, getAllFoodItems);
route.patch("/admin/deactivate/:id", verifyUser, verifyAdmin, deactivateFoodItem);
route.patch("/admin/reactivate/:id", verifyUser, verifyAdmin, reactivateFoodItem);

export default route

