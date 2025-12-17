import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "foodItem",
        required: true
      },
      name: String,
      price: Number,
      quantity: {
        type: Number,
        required: true
      },
      size: String,
      subtotal: Number
    }
  ],
  deliveryDetails: {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },
  orderStatus: {
    type: String,
    enum: ["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
    default: "confirmed"
  },
  paymentMethod: {
    type: String,
    default: "razorpay"
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const OrderModel = mongoose.model("Order", orderSchema);

export default OrderModel;
