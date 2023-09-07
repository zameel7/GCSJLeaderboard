require('dotenv').config();
const express = require("express");

const { google } = require("googleapis");

const app = express();
const port = 8080;
const id = process.env.SHEET_ID;

const base64PrivateKey = process.env.PRIVATE_KEY;
const privateKeyBuffer = Buffer.from(base64PrivateKey, 'base64');
const privateKey = privateKeyBuffer.toString('utf-8');

const keys = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
  };  

//This allows us to parse the incoming request body as JSON
app.use(express.json());

// With this, we'll listen for the server on port 8080
app.listen(port, () => console.log(`Listening on port ${port}`));

async function authSheets() {
    //Function for authentication object
    const auth = new google.auth.GoogleAuth({
        credentials: keys,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    //Create client instance for auth
    const authClient = await auth.getClient();

    //Instance of the Sheets API
    const sheets = google.sheets({ version: "v4", auth: authClient });

    return {
        auth,
        authClient,
        sheets,
    };
}

app.get("/leaderboard", async (req, res) => {
    try {
        const { sheets } = await authSheets();

        // Check if the secret key is provided in the request body
        const { secret } = req.body;
        if (secret !== process.env.API_SECRET) {
            // If the provided secret key doesn't match, return an unauthorized response
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Specify the columns you want to retrieve (A, B, G, H, I, J, and K)
        const range = "leaderboard";

        // Read rows from the specified range
        const getRows = await sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: range,
        });

        // Process the data and transform it into the desired format
        const transformedData = getRows.data.values.slice(1).map((row) => {
            const [
                name,
                email,
                institution,
                enrolDate,
                enrolStatus,
                skillboostLink,
                coursesCompleted,
                skillBadgesCompleted,
                genAIGameCompleted,
                totalCompletion,
                redemptionStatus,
            ] = row;

            // Calculate the score
            const score =
                parseInt(coursesCompleted) +
                parseInt(skillBadgesCompleted) +
                parseInt(genAIGameCompleted);

            // Determine if the person is finished and has redeemed
            const isFinished = redemptionStatus === "Yes";
            const hasRedeemed = totalCompletion === "Yes";

            return {
                name,
                email,
                score,
                isFinished,
                hasRedeemed,
            };
        });

        // Sort the transformedData based on score in descending order
        transformedData.sort((a, b) => b.score - a.score);

        res.json(transformedData);
    } catch (error) {
        console.error("Error in transforming data:", error);
        res.status(500).send("Internal Server Error");
    }
});
