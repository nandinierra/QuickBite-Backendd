import UserModel from "../model/user.model.js";
import OrderModel from "../model/order.model.js";
import { z } from "zod";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

export async function getUserProfile(req, res) {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 });

    const statistics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      lastOrderDate:
        orders.length > 0 ? orders[0].createdAt : null,
    };

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      statistics,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to retrieve profile",
    });
  }
}

export async function updateUserProfile(req, res) {
  try {
    const userId = req.user._id;
    const { name, email, phone, address } = req.body;

    const UpdateProfileRules = z.object({
      name: z.string().min(5).max(20).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    });

    const result = UpdateProfileRules.safeParse({
      name,
      email,
      phone,
      address,
    });

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        error: result.error,
      });
    }

    if (email) {
      const existingUser = await UserModel.findOne({
        email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use",
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    updateData.updatedAt = new Date();

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update profile",
    });
  }
}

export async function uploadProfilePicture(req, res) {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.profilePicture) {
      try {
        const publicId = user.profilePicture.split("/").slice(-1)[0].split(".")[0];
        await deleteFromCloudinary(`quickbite/profiles/${publicId}`);
      } catch (deleteError) {
        console.log("Error deleting old image:", deleteError);
      }
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      `profile_${userId}_${Date.now()}`
    );

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        profilePicture: uploadResult.secure_url,
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      message: error.message || "Failed to upload profile picture",
    });
  }
}
