import { Router } from "express";
import multer from "multer";
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../controller/profile.controller.js";
import { verifyUser } from "../middleware/auth.js";

const profileRoute = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

profileRoute.get("/get", verifyUser, getUserProfile);
profileRoute.put("/update", verifyUser, updateUserProfile);
profileRoute.post("/upload-picture", verifyUser, upload.single("profilePicture"), uploadProfilePicture);

export default profileRoute;
