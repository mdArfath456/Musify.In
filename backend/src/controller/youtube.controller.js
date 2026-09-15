const { searchYoutube } = require("../services/youtube.service")

const search = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || !q.trim()) {
            return res.status(400).json({
                message: "A search query is required"
            })
        }

        const results = await searchYoutube(q);
        return res.status(200).json({
            message: "Search results fetched successfully",
            results
        })
    } catch (error) {
        return res.status(500).json({
            message: "Could not search online right now"
        })
    }
}

module.exports = { search }