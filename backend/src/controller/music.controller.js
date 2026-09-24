const trackRepository = require("../repositories/track.repository")
const albumRepository = require("../repositories/album.repository")
const userRepository = require("../repositories/user.repository")
const { uploadFile } = require("../services/storage.service")
const { mapTrack, mapAlbumSummary, mapAlbumFull, mapUserPublic } = require("../repositories/mappers")
const dotenv = require("dotenv").config()

const createMusic = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(400).json({ message: "An artist account is required to upload music" })
        }
        const result = await uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );
        const music = await trackRepository.create({
            title: req.body.title,
            artistId: req.user.id,
            uri: result.url
        });
        if (!music) {
            return res.status(400).json({
                message: "Failed to create music"
            });
        }
        return res.status(201).json({
            message: "Music created successfully",
            music: mapTrack(music)
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};


const createAlbum = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(400).json({ message: "An artist account is required to create an album" })
        }
        const { title, musics } = req.body
        const album = await albumRepository.create({
            title,
            artistId: req.user.id,
            trackIds: musics || []
        })
        if (!album) {
            return res.status(400).json({
                message: "Failed to create album"
            })
        }
        return res.status(201).json({
            message: "Album created successfully",
            album: mapAlbumFull(album)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


const getAllMusics = async (req, res) => {
    try {
        const musics = await trackRepository.findAllWithArtist();
        res.status(201).json({
            message: "Musics fetched successfully",
            musics: musics.map(mapTrack)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// All tracks the requesting artist has uploaded (any session), newest first —
// used to build albums from a full catalog instead of just this session's uploads.
const getMyTracks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                message: "No signed-in artist",
                musics: []
            })
        }
        const musics = await trackRepository.findByArtist(req.user.id)
        return res.status(200).json({
            message: "Your tracks fetched successfully",
            musics: musics.map(mapTrack)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


const getAllAlbums = async (req, res) => {
    try {
        const albums = await albumRepository.findAllWithArtist();
        res.status(201).json({
            message: "Albums fetched successfully",
            albums: albums.map(mapAlbumSummary)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


const getAlbumById = async (req, res) => {
    try {
        const albumId = req.params.albumId;
        const album = await albumRepository.findByIdWithTracksAndArtist(albumId);
        if (!album) {
            return res.status(404).json({
                message: "Album not found"
            })
        }
        res.status(201).json({
            message: "Album fetched successfully",
            album: mapAlbumFull(album)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}


const addMusicToAlbum = async (req, res) => {
    try {
        const album = await albumRepository.addTrack(req.params.id, req.body.musicId);
        if (!album) {
            return res.status(404).json({
                message: "Album not found"
            })
        }
        return res.json({
            message: "Music added to album successfully",
            album: mapAlbumFull(album)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// Increments a track's play count and records it against the requesting
// user's recently-played list (most recent first, capped at 20, no
// duplicate entries for the same track).
const recordPlay = async (req, res) => {
    try {
        const musicId = req.params.id;
        const music = await trackRepository.incrementPlayCount(musicId);
        if (!music) {
            return res.status(404).json({
                message: "Track not found"
            })
        }

        if (req.user) {
            await userRepository.recordRecentlyPlayed(req.user.id, musicId)
        }

        return res.status(200).json({
            message: "Play recorded",
            playCount: music.play_count
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

const getRecentlyPlayed = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                message: "No signed-in user",
                recentlyPlayed: []
            })
        }
        const rows = await userRepository.getRecentlyPlayed(req.user.id, 20)

        const recentlyPlayed = rows
            .filter((entry) => entry.track) // guard against a since-deleted track
            .map((entry) => ({ ...mapTrack(entry.track), playedAt: entry.played_at }));

        return res.status(200).json({
            message: "Recently played fetched successfully",
            recentlyPlayed
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// Toggles a track in the requesting user's liked tracks.
const toggleLikeTrack = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                message: "Track liked for this session",
                liked: true,
                persistent: false
            })
        }
        const musicId = req.params.id;
        const music = await trackRepository.findById(musicId);
        if (!music) {
            return res.status(404).json({
                message: "Track not found"
            })
        }

        const alreadyLiked = await userRepository.isTrackLiked(req.user.id, musicId)

        if (alreadyLiked) {
            await userRepository.unlikeTrack(req.user.id, musicId)
        } else {
            await userRepository.likeTrack(req.user.id, musicId)
        }

        return res.status(200).json({
            message: alreadyLiked ? "Track unliked" : "Track liked",
            liked: !alreadyLiked
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

const getLikedTracks = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                message: "No signed-in user",
                musics: []
            })
        }
        const likedIds = await userRepository.getLikedTrackIds(req.user.id)
        const tracks = await trackRepository.findByIds(likedIds)

        return res.status(200).json({
            message: "Liked tracks fetched successfully",
            musics: tracks.map(mapTrack)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// Public-facing artist page: profile info plus everything they've published.
const getArtistProfile = async (req, res) => {
    try {
        const { artistId } = req.params;
        const artist = await userRepository.findById(artistId);
        if (!artist || artist.role !== "artist") {
            return res.status(404).json({
                message: "Artist not found"
            })
        }

        const musics = await trackRepository.findByArtist(artistId);
        const albums = await albumRepository.findByArtist(artistId);

        return res.status(200).json({
            message: "Artist profile fetched successfully",
            artist: { ...mapUserPublic(artist), role: artist.role },
            musics: musics.map(mapTrack),
            albums: albums.map(mapAlbumSummary)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

// "Add to Liked Songs" for a YouTube search result. The shared library only
// ever holds one row per video (findOrCreateYoutubeTrack), so if someone
// else already added this exact video, this just reuses that row and likes
// it for the current user too — no duplicates pile up in the library.
const addYoutubeTrackToLiked = async (req, res) => {
    try {
        const { videoId, title, channelTitle, thumbnail } = req.body
        if (!videoId || !title) {
            return res.status(400).json({ message: "videoId and title are required" })
        }

        if (!req.user) {
            return res.status(200).json({
                message: "Added to Liked Songs for this session",
                persistent: false,
                music: {
                    _id: videoId,
                    title,
                    source: "youtube",
                    youtubeVideoId: videoId,
                    thumbnail,
                    channelTitle,
                    playCount: 0,
                    artist: channelTitle
                }
            })
        }

        const track = await trackRepository.findOrCreateYoutubeTrack({
            videoId,
            title,
            channelTitle,
            thumbnail,
            addedByUserId: req.user.id
        })

        const alreadyLiked = await userRepository.isTrackLiked(req.user.id, track.id)
        if (!alreadyLiked) {
            await userRepository.likeTrack(req.user.id, track.id)
        }

        return res.status(200).json({
            message: "Added to Liked Songs",
            music: mapTrack(track)
        })
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        })
    }
}

module.exports = {
    createMusic,
    createAlbum,
    addMusicToAlbum,
    getAllMusics,
    getAllAlbums,
    getAlbumById,
    recordPlay,
    getRecentlyPlayed,
    toggleLikeTrack,
    getLikedTracks,
    getArtistProfile,
    getMyTracks,
    addYoutubeTrackToLiked
}
