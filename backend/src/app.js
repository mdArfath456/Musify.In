const express = require("express")

const cookieParse = require("cookie-parser")

const cors = require("cors")

const helmet = require("helmet")

const dotenv = require("dotenv").config()

const authRoutes = require("./routes/auth.routes")

const musicRoutes = require("./routes/music.routes")

const aiRoutes = require("./routes/ai.routes")

const youtubeRoutes = require("./routes/youtube.routes")

const { sanitizeBody } = require("./middlewares/sanitize.middleware")

const app = express()

app.set("trust proxy", 1)

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        frameguard: false
    })
)

app.use(cookieParse())

app.use(express.json())

app.use(sanitizeBody)

app.use(
    cors({
        origin: (origin, callback) => callback(null, true),
        credentials: true,
    })
)

app.use("/api/auth", authRoutes)

app.use("/api/music", musicRoutes)

app.use("/api/ai", aiRoutes)

app.use("/api/youtube", youtubeRoutes)

module.exports = app