

import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
import UserModel from "../model/user.model.js";
import { z } from "zod";

const ROLE_PERMISSIONS = {
    customer: ["read_food"],
    admin: ["read_food", "create_food", "update_food", "delete_food", "manage_users", "view_orders", "manage_orders"],

};

export async function registerUser(req, res) {

    const { name, email, password, role, adminSecretKey } = req.body;

    //  Zod validation with detailed error messages
    const UserRules = z.object({
        name: z.string()
            .min(3, "Name must be at least 3 characters long")
            .max(50, "Name must not exceed 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
            .trim(),
        email: z.string()
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),
        password: z.string()
            .min(6, "Password must be at least 6 characters long")
            .max(50, "Password must not exceed 50 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
        role: z.enum(["customer", "admin"], {
            errorMap: () => ({ message: "Role must be either customer, admin" })
        }).optional().default("customer"),
        adminSecretKey: z.string().optional()
    });

    const result = UserRules.safeParse({ name, email, password, role, adminSecretKey });

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));

        return res.status(400).json({
            message: "Validation failed",
            errors: errors
        });
    }

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "user already exists"
            })
        }

        const userRole = result.data.role || "customer";

        if (userRole === "admin") {
            const correctAdminSecret = process.env.ADMIN_SECRET_KEY;
            if (!result.data.adminSecretKey || result.data.adminSecretKey.trim() === "") {
                return res.status(400).json({
                    message: "Admin secret key is required for admin registration",
                    errors: [{ field: "adminSecretKey", message: "Admin secret key is required" }]
                })
            }
            if (result.data.adminSecretKey !== correctAdminSecret) {
                return res.status(403).json({
                    message: "Invalid admin secret key",
                    errors: [{ field: "adminSecretKey", message: "The admin secret key you entered is incorrect" }]
                })
            }
        }

        const hashedPassword = await bcrypt.hash(result.data.password, 10);
        const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.customer;

        const newUser = await UserModel.create({
            name: result.data.name,
            email: result.data.email,
            password: hashedPassword,
            role: userRole,
            permissions: permissions,
            isActive: true
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                permissions: newUser.permissions,
                profilePicture: newUser.profilePicture
            }
        })
    } catch (e) {
        res.status(500).json({
            message: e.message || "Registration failed"
        })
    }

}

export async function loginUser(req, res) {

    const { email, password } = req.body;

    // Enhanced Zod validation for login
    const LoginRules = z.object({
        email: z.string()
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),
        password: z.string()
            .min(1, "Password is required")
    });

    const result = LoginRules.safeParse({ email, password });

    if (!result.success) {
        const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));

        return res.status(400).json({
            message: "Validation failed",
            errors: errors
        });
    }

    try {
        const existingUser = await UserModel.findOne({ email: result.data.email });
        if (!existingUser) {
            return res.status(400).json({
                message: "Invalid email or password",
                errors: [{ field: "email", message: "No account found with this email address" }]
            })
        }

        if (!existingUser.isActive) {
            return res.status(403).json({
                message: "Account is inactive",
                errors: [{ field: "email", message: "Your account has been deactivated. Please contact administrator." }]
            })
        }

        const isPasswordValid = await bcrypt.compare(result.data.password, existingUser.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password",
                errors: [{ field: "password", message: "Incorrect password" }]
            })
        }

        const secretCode = process.env.SECRETCODE;
        const payload = {
            _id: existingUser._id.toString(),
            email: existingUser.email,
            role: existingUser.role,
            permissions: existingUser.permissions
        }
        const jwtToken = jwt.sign(payload, secretCode, { expiresIn: "30d" })

        await UserModel.findByIdAndUpdate(existingUser._id, { lastLogin: new Date() }, { new: true })

        console.log("--- Login User ---");
        console.log("NODE_ENV:", process.env.NODE_ENV);
        console.log("Setting jwt_token cookie...");

        res.cookie("jwt_token", jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: "/"
        });

        return res.status(200).json({
            // token: jwtToken, // Token removed from body
            message: "Login successful",
            user: {
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                permissions: existingUser.permissions,
                profilePicture: existingUser.profilePicture
            }
        })
    } catch (e) {
        return res.status(500).json({
            message: e.message || "Login failed"
        })
    }

}

export const finalRes = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        res.status(200).json({
            message: "Valid User",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions,
                profilePicture: user.profilePicture
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to verify user"
        })
    }
}

export const logoutUser = (req, res) => {
    res.clearCookie("jwt_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    });
    return res.status(200).json({ message: "Logout successful" });
}
