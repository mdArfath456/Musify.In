import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const app = require("./backend/src/app.js");
const connectDB = require("./backend/src/db/db.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Port 3000 is required by the AI Studio environment
const PORT = 3000;

async function startServer() {
    try {
        await connectDB();
    } catch (e) {
        console.warn("[Musify] DB init notice:", e.message);
    }

    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.resolve(__dirname, "dist")));
        app.get("*", (req, res, next) => {
            if (req.path.startsWith("/api")) return next();
            res.sendFile(path.resolve(__dirname, "dist/index.html"));
        });
    } else {
        const vite = await createViteServer({
            server: {
                middlewareMode: true,
                host: "0.0.0.0",
                port: PORT,
                hmr: false
            },
            appType: "spa",
            root: __dirname
        });
        app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Musify] Server listening at http://0.0.0.0:${PORT}`);
    });
}

startServer();
