

import foodModel from "../model/food.model.js";

// Seed helper (kept for backwards compatibility / manual seeding)
export const foodRoute = async (req, res) => {
  const data = await foodModel.insertMany(req.body);
  res.status(201).json({ message: data });
};

// Get food by category for customers (only active items)
export const getfooddetails = async (req, res) => {
  try {
    const { category } = req.params;
    const items = await foodModel
      .find({ category, isActive: true })
      .lean();

    return res.status(200).json({ food: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Popular dishes (only active)
export const getpopularDishes = async (_req, res) => {
  try {
    const items = await foodModel
      .find({ popular: true, isActive: true })
      .lean();

    return res.status(200).json({ food: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Filter with search/type (only active for customers)
export const filterfood = async (req, res) => {
  try {
    const { type, search } = req.query;
    const { category } = req.params;

    const filter = { category, isActive: true };

    if (type && type !== "All") {
      filter.type = type;
    }

    if (search && search.trim() !== "") {
      filter.name = { $regex: search, $options: "i" };
    }

    const requireditems = await foodModel.find(filter).lean();
    return res.status(200).json({ food: requireditems });
  } catch (e) {
    return res.status(500).json({ message: e.message || e });
  }
};

// Get single item (only active for customers)
export const getfoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await foodModel.findById(id).lean();

    if (!item || !item.isActive) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res.status(200).json({ food: item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ---------- Admin / Moderator APIs ----------

export const createFoodItem = async (req, res) => {
  try {
    const {
      name,
      category,
      type,
      description,
      price,
      image,
      popular = false,
      rating = "0",
    } = req.body;

    if (!name || !category || !type || !price?.regular || !price?.medium || !price?.large) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const createdBy = req.user?._id;
    const item = await foodModel.create({
      name,
      category,
      type,
      description,
      price,
      image,
      popular,
      rating,
      createdBy,
      lastUpdatedBy: createdBy,
      isActive: true,
    });

    return res
      .status(201)
      .json({ message: "Food item created successfully", food: item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user?._id,
      updatedAt: new Date(),
    };

    const updated = await foodModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res
      .status(200)
      .json({ message: "Food item updated successfully", food: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await foodModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res
      .status(200)
      .json({ message: "Food item deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllFoodItems = async (_req, res) => {
  try {
    const items = await foodModel
      .find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("lastUpdatedBy", "name email role")
      .lean();
    return res.status(200).json({ food: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getActiveFoodItems = async (_req, res) => {
  try {
    const items = await foodModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .populate("lastUpdatedBy", "name email role")
      .lean();
    return res.status(200).json({ food: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deactivateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await foodModel
      .findByIdAndUpdate(
        id,
        { isActive: false, lastUpdatedBy: req.user?._id, updatedAt: new Date() },
        { new: true }
      )
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res
      .status(200)
      .json({ message: "Food item deactivated", food: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const reactivateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await foodModel
      .findByIdAndUpdate(
        id,
        { isActive: true, lastUpdatedBy: req.user?._id, updatedAt: new Date() },
        { new: true }
      )
      .lean();

    if (!updated) {
      return res.status(404).json({ message: "Food item not found" });
    }

    return res
      .status(200)
      .json({ message: "Food item reactivated", food: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

