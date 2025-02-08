const express = require("express");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send("❌ No authorization code provided!");

    try {
        // 🔹 Exchange code for access token
        const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
        }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

        const accessToken = tokenResponse.data.access_token;

        // 🔹 Get user info
        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userId = userResponse.data.id;

        saveUserToDatabase(userId, accessToken);

        res.send("✅ Authorization successful! You can now be auto-rejoined.");
    } catch (err) {
        console.error(err);
        res.send("❌ Error during authorization.");
    }
});

app.listen(PORT, () => console.log(`OAuth2 server running on http://localhost:${PORT}`));

// 📌 Save authorized users
function saveUserToDatabase(userId, token) {
    let users = [];
    if (fs.existsSync("./users.json")) {
        users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
    }
    users.push({ id: userId, token: token });
    fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));
}
