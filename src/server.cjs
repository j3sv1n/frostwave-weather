const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "*" }));

const API_HOST = "https://discoveryprovider.audius.co";
const PLAYLIST_ID = "XV4M27Z";

app.get("/get-music", async (req, res) => {
  try {
    const response = await axios.get(`${API_HOST}/v1/playlists/${PLAYLIST_ID}/tracks`);
    const tracks = response.data.data;

    if (tracks.length > 0) {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      const trackId = randomTrack.id;

      const streamUrl = `${API_HOST}/v1/tracks/${trackId}/stream`;
      res.json({ streamUrl });
    } else {
      res.status(404).json({ error: "No tracks found" });
    }
  } catch (error) {
    console.error("Error fetching music:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch music" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
