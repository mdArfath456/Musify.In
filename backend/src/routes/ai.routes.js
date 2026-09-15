const express = require("express")
const router = express.Router()
const aiController = require("../controller/ai.controller")
const authMiddleware = require("../middlewares/auth.middleware")

router.post("/recommend", authMiddleware.authAnyUser, aiController.recommend);
router.get("/similar/:trackId", authMiddleware.authAnyUser, aiController.similar);

module.exports = router