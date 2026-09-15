function stripDangerousKeys(value) {
    if (Array.isArray(value)) {
        return value.map(stripDangerousKeys);
    }
    if (value && typeof value === "object") {
        const clean = {};
        for (const [key, val] of Object.entries(value)) {
            if (key.startsWith("$") || key.includes(".")) continue;
            clean[key] = stripDangerousKeys(val);
        }
        return clean;
    }
    return value;
}

function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === "object") {
        req.body = stripDangerousKeys(req.body);
    }
    next();
}

module.exports = { sanitizeBody };