
import { CartModel } from "../model/cart.model.js";



export async function addToCart(req, res) {
  const userId = req.user._id;

  try {
    const { itemId, quantity = 1, size } = req.body;

    if (!itemId || !quantity) {
      return res.status(400).json({ message: "itemId and quantity are required" });
    }

    const cart = await CartModel.findOne({ userId });

    if (!cart) {
      await CartModel.create({ userId, foodItems: [{ itemId, quantity, size }] });
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
      return res
        .status(200)
        .json({ message: "Your item has been added to the cart successfully." });
    }

    existingItem.quantity += quantity;
    if (size && existingItem.size !== size) {
      existingItem.size = size;
    }
    await cart.save();
    return res.status(200).json({ message: "Quantity updated successfully" });
  } catch (e) {
    return res.status(400).json({ message: e.message || e });
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

    const length = data.foodItems.length;
    return res.status(200).json({ data, length });
  } catch (e) {
    return res.status(400).json({ message: e.message || e });
  }
}




export async function updateCartItem(req, res) {
  const { action } = req.body;
  const userId = req.user._id;
  try {
    const { itemId } = req.params;
    const userItem = await CartModel.findOne({ userId });
    if (!userItem) {
      return res.status(400).json({ message: "Cart not found for this user" });
    }

    const items = userItem.foodItems.find(
      (i) => i.itemId.toString() === itemId
    );
    if (!items) {
      return res.status(400).json({ message: "Product not found" });
    }

    if (action === "increase") {
      items.quantity += 1;
    } else if (items.quantity > 1) {
      items.quantity -= 1;
    }

    await userItem.save();
    return res.status(200).json({ message: "Cart has been updated" });
  } catch (e) {
    return res.status(400).json({ message: e.message || e });
  }
}



export async function deleteCartItem(req, res) {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const userItem = await CartModel.findOne({ userId });
    if (!userItem) {
      return res.status(400).json({ message: "Cart not found" });
    }
    userItem.foodItems.pull({ itemId });
    await userItem.save();
    return res.status(200).json({ message: "Product removed from cart" });
  } catch (e) {
    return res.status(400).json({ message: e.message || e });
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

