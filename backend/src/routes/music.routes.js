const express = require("express")
const router = express.Router()
const musicController = require("../controller/music.controller")
const multer = require("multer")
const { authAnyUser } = require("../middlewares/auth.middleware")

const upload = multer({ storage: multer.memoryStorage() })
router.post("/upload", upload.single("music"), musicController.createMusic)
router.post("/album", musicController.createAlbum)
router.post("/album/:id/add-music", musicController.addMusicToAlbum)
router.get("/", musicController.getAllMusics);
router.get("/albums", musicController.getAllAlbums);
router.get("/albums/:albumId", musicController.getAlbumById);
router.get("/mine", musicController.getMyTracks);

router.get("/liked", authAnyUser, musicController.getLikedTracks);
router.post("/youtube/add-liked", authAnyUser, musicController.addYoutubeTrackToLiked);
router.get("/recent", authAnyUser, musicController.getRecentlyPlayed);
router.get("/artist/:artistId", musicController.getArtistProfile);
router.post("/:id/play", authAnyUser, musicController.recordPlay);
router.post("/:id/like", authAnyUser, musicController.toggleLikeTrack);


module.exports = router