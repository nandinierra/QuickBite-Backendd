

import { registerUser, loginUser, finalRes, logoutUser } from "../controller/auth.controller.js"

import { verifyUser } from "../middleware/auth.js"
import { Router } from "express";

const route = Router();

route.post("/register", registerUser)
route.post("/login", loginUser)
route.post("/logout", logoutUser)
route.get("/api/verify", verifyUser, finalRes)


export default route


