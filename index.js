require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { google } = require("googleapis");

const app = express();
const port = 8080;
const id = process.env.SHEET_ID;

// Enable CORS for all routes
app.use(cors());

const base64PrivateKey = process.env.PRIVATE_KEY;
const privateKeyBuffer = Buffer.from(base64PrivateKey, "base64");
const privateKey = privateKeyBuffer.toString("utf-8");

const keys = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: privateKey.replace(/\\n/g, "\n"),
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

app.get("/", (req, res) => {
    const acceptHeader = req.headers.accept;

    const responseData = {
        message: "Google Cloud Study Jam Leaderboard API!",
        endpoints: [
            {
                name: "Leaderboard",
                description: "Retrieve the leaderboard data.",
                method: "POST",
                path: "/leaderboard",
            },
            {
                name: "Group Scores",
                description: "Retrieve group-wise scores.",
                method: "POST",
                path: "/group-scores",
            },
        ],
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Cloud Study Jam Leaderboard API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            margin: 0;
            padding: 0;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
          }
          p {
            font-size: 18px;
          }
          ul {
            list-style-type: square;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Google Cloud Study Jam Leaderboard API!</h1>
          <p>Here are the available endpoints:</p>
          <ul>
            <li>
              <strong>Leaderboard:</strong> Retrieve the leaderboard data.
              <br>Method: POST
              <br>Path: /leaderboard
            </li>
            <li>
              <strong>Group Scores:</strong> Retrieve group-wise scores.
              <br>Method: POST
              <br>Path: /group-scores
            </li>
          </ul>
        </div>
      </body>
      </html>
    `;

    // Check if the Accept header indicates JSON
    if (acceptHeader && acceptHeader.includes("application/json")) {
        // Respond with JSON if the request wants JSON
        res.json(responseData);
    } else {
        // Respond with HTML (for browsers or other unsupported clients)
        res.send(htmlContent);
    }
});

app.post("/leaderboard", async (req, res) => {
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
                group,
            ] = row;

            // Calculate the score
            const score =
                parseInt(coursesCompleted) +
                parseInt(skillBadgesCompleted) +
                parseInt(genAIGameCompleted);

            // Determine if the person is finished and has redeemed
            const isFinished = totalCompletion === "Yes";
            const hasRedeemed = redemptionStatus === "Yes";

            return {
                name,
                email,
                score,
                isFinished,
                hasRedeemed,
                group,
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

app.post("/group-scores", async (req, res) => {
    try {
        const { sheets } = await authSheets();

        // Check if the secret key is provided in the request body
        const { secret } = req.body;
        if (secret !== process.env.API_SECRET) {
            // If the provided secret key doesn't match, return an unauthorized response
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Specify the columns you want to retrieve, including the "Group" column
        const range = "leaderboard";

        // Read rows from the specified range
        const getRows = await sheets.spreadsheets.values.get({
            spreadsheetId: id,
            range: range,
        });

        // Process the data and calculate group scores
        const groupScores = {};

        getRows.data.values.slice(1).forEach((row) => {
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
                group,
            ] = row;

            // Calculate the score for this row
            const score =
                parseInt(coursesCompleted) +
                parseInt(skillBadgesCompleted) +
                parseInt(genAIGameCompleted);

            // Create or update the group score
            if (!groupScores[group]) {
                groupScores[group] = 0;
            }
            groupScores[group] += score;
        });

        const sortedGroupScores = Object.keys(groupScores).map((group) => ({
            group,
            score: groupScores[group],
        }));

        // Sort the array by score in descending order
        sortedGroupScores.sort((a, b) => b.score - a.score);
        res.json(sortedGroupScores);
    } catch (error) {
        console.error("Error in calculating group scores:", error);
        res.status(500).send("Internal Server Error");
    }
});
