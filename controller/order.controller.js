import Razorpay from "razorpay";
import crypto from "crypto";
import OrderModel from "../model/order.model.js";
import { CartModel } from "../model/cart.model.js";
import foodModel from "../model/food.model.js";

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

export async function createOrder(req, res) {
  try {
    const userId = req.user._id;
    const { deliveryDetails, notes } = req.body;

    if (!deliveryDetails || !deliveryDetails.fullName || !deliveryDetails.email || 
        !deliveryDetails.phone || !deliveryDetails.address || !deliveryDetails.city || 
        !deliveryDetails.postalCode) {
      return res.status(400).json({ 
        message: "All delivery details are required" 
      });
    }

    const cart = await CartModel.findOne({ userId }).populate("foodItems.itemId");
    
    if (!cart || cart.foodItems.length === 0) {
      return res.status(400).json({ 
        message: "Cart is empty" 
      });
    }

    let totalAmount = 0;
    const items = [];

    for (const item of cart.foodItems) {
      if (!item.itemId) {
        console.error("Item reference is null:", item);
        return res.status(404).json({ 
          message: "One or more items in cart are no longer available" 
        });
      }

      const foodItem = item.itemId._id ? await foodModel.findById(item.itemId._id) : item.itemId;
      
      if (!foodItem) {
        return res.status(404).json({ 
          message: "Food item not found" 
        });
      }

      if (!foodItem.isActive) {
        return res.status(400).json({ 
          message: `${foodItem.name || "Item"} is no longer available` 
        });
      }

      if (!item.size) {
        return res.status(400).json({ 
          message: "Item size is missing" 
        });
      }

      const priceKey = item.size.toLowerCase();
      const itemPrice = foodItem.price?.[priceKey];

      if (!itemPrice) {
        return res.status(400).json({ 
          message: `Invalid size: ${item.size} for ${foodItem.name || "item"}` 
        });
      }

      const subtotal = itemPrice * item.quantity;
      totalAmount += subtotal;

      items.push({
        itemId: foodItem._id,
        name: foodItem.name,
        price: itemPrice,
        quantity: item.quantity,
        size: item.size,
        subtotal
      });
    }

    const orderId = `ORD-${Date.now().toString().slice(-10)}`;
    const amountInPaisa = Math.round(totalAmount * 100);

    const razorpayOrder = await getRazorpayInstance().orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: orderId,
      notes: {
        userId: userId.toString(),
        ...notes
      }
    });

    const order = await OrderModel.create({
      userId,
      orderId,
      razorpayOrderId: razorpayOrder.id,
      items,
      deliveryDetails,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "confirmed",
      notes: notes?.description || null
    });

    res.status(201).json({
      message: "Order created successfully",
      order: {
        id: order._id,
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: "INR",
        items,
        deliveryDetails
      }
    });

  } catch (error) {
    console.error("Error in createOrder:", error);
    res.status(500).json({ 
      message: error.message || "Failed to create order" 
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        message: "Missing payment verification details" 
      });
    }

    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ 
        message: "Payment signature verification failed" 
      });
    }

    const order = await OrderModel.findOneAndUpdate(
      { razorpayOrderId },
      {
        paymentStatus: "success",
        razorpayPaymentId,
        razorpaySignature,
        updatedAt: new Date()
      },
      { new: true }
    ).populate("items.itemId");

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    await CartModel.deleteOne({ userId: order.userId });

    res.status(200).json({
      message: "Payment verified successfully",
      order: {
        id: order._id,
        orderId: order.orderId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        totalAmount: order.totalAmount
      }
    });

  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({ 
      message: error.message || "Payment verification failed" 
    });
  }
}

export async function getUserOrders(req, res) {
  try {
    const userId = req.user._id;

    const orders = await OrderModel.find({ userId })
      .populate("items.itemId")
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(200).json({ 
        message: "No orders found",
        orders: [] 
      });
    }

    res.status(200).json({
      message: "Orders retrieved successfully",
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error("Error in getUserOrders:", error);
    res.status(500).json({ 
      message: error.message || "Failed to retrieve orders" 
    });
  }
}

export async function getOrderDetails(req, res) {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await OrderModel.findOne({ 
      _id: orderId, 
      userId 
    }).populate("items.itemId");

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    res.status(200).json({
      message: "Order details retrieved successfully",
      order
    });

  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.status(500).json({ 
      message: error.message || "Failed to retrieve order details" 
    });
  }
}

export async function cancelOrder(req, res) {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await OrderModel.findOne({ 
      _id: orderId, 
      userId 
    });

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    if (order.paymentStatus === "success" && 
        (order.orderStatus === "preparing" || order.orderStatus === "ready" || 
         order.orderStatus === "out_for_delivery")) {
      return res.status(400).json({ 
        message: "Order cannot be cancelled at this stage" 
      });
    }

    order.orderStatus = "cancelled";
    order.notes = reason || "Order cancelled by customer";
    order.updatedAt = new Date();
    
    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order: {
        id: order._id,
        orderId: order.orderId,
        orderStatus: order.orderStatus
      }
    });

  } catch (error) {
    console.error("Error in cancelOrder:", error);
    res.status(500).json({ 
      message: error.message || "Failed to cancel order" 
    });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    const order = await OrderModel.findByIdAndUpdate(
      orderId,
      { 
        orderStatus: status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate("items.itemId");

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: {
        id: order._id,
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
      }
    });

  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({ 
      message: error.message || "Failed to update order status" 
    });
  }
}

export async function retryPayment(req, res) {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;

    const order = await OrderModel.findOne({ 
      _id: orderId, 
      userId 
    });

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    if (order.paymentStatus === "success") {
      return res.status(400).json({ 
        message: "Payment for this order has already been completed" 
      });
    }

    if (order.paymentStatus === "failed") {
      return res.status(400).json({ 
        message: "Payment for this order has failed. Please contact support" 
      });
    }

    const amountInPaisa = Math.round(order.totalAmount * 100);

    const razorpayOrder = await getRazorpayInstance().orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: `${order.orderId}-retry`,
      notes: {
        userId: userId.toString(),
        originalOrderId: order._id.toString(),
        retryAttempt: true
      }
    });

    await OrderModel.findByIdAndUpdate(
      orderId,
      {
        razorpayOrderId: razorpayOrder.id,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      message: "Payment retry initiated successfully",
      order: {
        id: order._id,
        orderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.totalAmount,
        currency: "INR"
      }
    });

  } catch (error) {
    console.error("Error in retryPayment:", error);
    res.status(500).json({ 
      message: error.message || "Failed to retry payment" 
    });
  }
}
