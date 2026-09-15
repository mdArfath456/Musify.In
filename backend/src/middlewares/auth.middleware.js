const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");

const JWT_ISSUER = process.env.JWT_ISSUER || "musify-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "musify-app";

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });

        const user = await userRepository.findById(decoded.id);
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};

const authArtist = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== "artist") {
            return res.status(403).json({
                message: "You don't have any access",
            });
        }
        next();
    });
};

const authUser = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== "user") {
            return res.status(403).json({
                message: "You don't have any access",
            });
        }
        next();
    });
};

const authAnyUser = (req, res, next) => {
    verifyToken(req, res, next);
};

module.exports = {
    authArtist,
    authUser,
    authAnyUser,
    JWT_ISSUER,
    JWT_AUDIENCE
};