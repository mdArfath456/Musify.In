const express = require("express")
const router = express.Router()
const aiController = require("../controller/ai.controller")

router.post("/recommend", aiController.recommend);
router.get("/similar/:trackId", aiController.similar);

module.exports = router