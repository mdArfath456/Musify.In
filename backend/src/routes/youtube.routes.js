const express = require("express")
const router = express.Router()
const youtubeController = require("../controller/youtube.controller")

router.get("/search", youtubeController.search);

module.exports = router