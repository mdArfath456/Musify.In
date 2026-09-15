const express = require("express")
const router = express.Router()
const youtubeController = require("../controller/youtube.controller")
const authMiddleware = require("../middlewares/auth.middleware")

router.get("/search", authMiddleware.authAnyUser, youtubeController.search);

module.exports = router