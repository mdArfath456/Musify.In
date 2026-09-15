const express = require("express")
const router = express.Router()
const musicController = require("../controller/music.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const multer = require("multer")

const upload = multer({ storage: multer.memoryStorage() })
router.post("/upload", authMiddleware.authArtist, upload.single("music"), musicController.createMusic)
router.post("/album", authMiddleware.authArtist, musicController.createAlbum)
router.post("/album/:id/add-music", authMiddleware.authArtist, musicController.addMusicToAlbum)
router.get("/", authMiddleware.authAnyUser, musicController.getAllMusics);
router.get("/albums", authMiddleware.authAnyUser, musicController.getAllAlbums);
router.get("/albums/:albumId", authMiddleware.authAnyUser, musicController.getAlbumById);
router.get("/mine", authMiddleware.authArtist, musicController.getMyTracks);

router.get("/liked", authMiddleware.authAnyUser, musicController.getLikedTracks);
router.post("/youtube/add-liked", authMiddleware.authAnyUser, musicController.addYoutubeTrackToLiked);
router.get("/recent", authMiddleware.authAnyUser, musicController.getRecentlyPlayed);
router.get("/artist/:artistId", authMiddleware.authAnyUser, musicController.getArtistProfile);
router.post("/:id/play", authMiddleware.authAnyUser, musicController.recordPlay);
router.post("/:id/like", authMiddleware.authAnyUser, musicController.toggleLikeTrack);


module.exports = router