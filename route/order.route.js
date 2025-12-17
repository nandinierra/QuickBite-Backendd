import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus,
  retryPayment
} from "../controller/order.controller.js";
import { verifyUser, verifyAdmin } from "../middleware/auth.js";

const orderRoute = Router();

orderRoute.post("/create", verifyUser, createOrder);
orderRoute.post("/verify-payment", verifyUser, verifyPayment);
orderRoute.post("/:orderId/retry-payment", verifyUser, retryPayment);
orderRoute.get("/my-orders", verifyUser, getUserOrders);
orderRoute.get("/:orderId", verifyUser, getOrderDetails);
orderRoute.patch("/:orderId/cancel", verifyUser, cancelOrder);
orderRoute.patch("/:orderId/status", verifyUser, verifyAdmin, updateOrderStatus);

export default orderRoute;
