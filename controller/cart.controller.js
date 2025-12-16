
import { CartModel } from "../model/cart.model.js";
import { foodModel } from "../model/food.model.js";



export async function addToCart(req, res) {
  const userId = req.user._id;

  try {
    const { itemId, quantity = 1, size } = req.body;

    // Validate required fields
    if (!itemId || !quantity) {
      return res.status(400).json({ message: "itemId and quantity are required" });
    }

    if (!size) {
      return res.status(400).json({ message: "size is required" });
    }

    // Validate that the food item exists
    const foodItem = await foodModel.findById(itemId);
    if (!foodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    if (!foodItem.isActive) {
      return res.status(400).json({ message: "This item is no longer available" });
    }

    // Validate quantity
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      const newCart = await CartModel.create({ userId, foodItems: [{ itemId, quantity, size }] });
      console.log("New cart created:", newCart);
      return res
        .status(201)
        .json({ message: "Your item has been added to the cart successfully." });
    }

    const existingItem = cart.foodItems.find(
      (i) => i.itemId.toString() === itemId
    );

    if (!existingItem) {
      cart.foodItems.push({ itemId, quantity, size });
      await cart.save();
      console.log("Item added to cart:", { userId, itemId, quantity, size });
      return res
        .status(200)
        .json({ message: "Your item has been added to the cart successfully." });
    }

    // Item exists - update quantity and size if needed
    existingItem.quantity += quantity;
    if (size && existingItem.size !== size) {
      existingItem.size = size;
    }
    await cart.save();
    console.log("Item quantity updated:", { userId, itemId, newQuantity: existingItem.quantity });
    return res.status(200).json({ message: "Quantity updated successfully" });
  } catch (e) {
    console.error("Error in addToCart:", e);
    return res.status(400).json({ message: e.message || "Failed to add item to cart" });
  }
}




export async function getCartItems(req, res) {
  try {
    const userId = req.user._id;
    const data = await CartModel.findOne({ userId })
      .populate("foodItems.itemId")
      .lean();

    if (!data) {
      return res.status(200).json({ data: { foodItems: [] }, length: 0 });
    }

    // Filter out items where itemId is null (deleted food items)
    const validFoodItems = data.foodItems.filter(item => item.itemId !== null);
    
    // If there are invalid items, update the cart to remove them
    if (validFoodItems.length !== data.foodItems.length) {
      await CartModel.findOneAndUpdate(
        { userId },
        { foodItems: validFoodItems },
        { new: true }
      );
    }

    const length = validFoodItems.length;
    return res.status(200).json({ data: { ...data, foodItems: validFoodItems }, length });
  } catch (e) {
    return res.status(400).json({ message: e.message || e });
  }
}




export async function updateCartItem(req, res) {
  const { action } = req.body;
  const userId = req.user._id;
  try {
    const { itemId } = req.params;
    
    // Validate required fields
    if (!action || !["increase", "decrease"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'increase' or 'decrease'" });
    }

    console.log("updateCartItem called:", { userId, itemId, action });

    const userItem = await CartModel.findOne({ userId });
    if (!userItem) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    const items = userItem.foodItems.find(
      (i) => i.itemId.toString() === itemId
    );
    if (!items) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    console.log("Current item quantity:", items.quantity);

    if (action === "increase") {
      items.quantity += 1;
      console.log("Increased quantity to:", items.quantity);
    } else if (action === "decrease") {
      // Don't allow quantity to go below 1
      if (items.quantity > 1) {
        items.quantity -= 1;
        console.log("Decreased quantity to:", items.quantity);
      } else {
        return res.status(400).json({ message: "Quantity cannot be less than 1. Use remove button to delete item." });
      }
    }

    await userItem.save();
    console.log("Cart updated successfully");
    return res.status(200).json({ message: "Quantity updated successfully", quantity: items.quantity });
  } catch (e) {
    console.error("Error in updateCartItem:", e);
    return res.status(400).json({ message: e.message || "Failed to update cart" });
  }
}



export async function deleteCartItem(req, res) {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    console.log("deleteCartItem called:", { userId, itemId });

    const userItem = await CartModel.findOne({ userId });
    if (!userItem) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if item exists in cart before deleting
    const itemExists = userItem.foodItems.some(item => item.itemId.toString() === itemId);
    if (!itemExists) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Remove the item
    userItem.foodItems.pull({ itemId });
    await userItem.save();

    console.log("Item deleted successfully, remaining items:", userItem.foodItems.length);
    return res.status(200).json({ message: "Item removed from cart successfully", itemCount: userItem.foodItems.length });
  } catch (e) {
    console.error("Error in deleteCartItem:", e);
    return res.status(400).json({ message: e.message || "Failed to remove item from cart" });
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user._id;
    await CartModel.deleteOne({ userId });
    res.status(200).json({ message: "Cleared the cart successfully." });
  } catch (e) {
    res.status(400).json({ message: e.message || e });
  }
}

