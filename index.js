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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Cloud Study Jam Leaderboard API</title>
        <!-- Include Bootstrap 4 CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <!-- Include Font Awesome CSS -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
        <style>
            body {
                background-color: #f0f0f0;
            }
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .card {
                background-color: #fff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .card-title {
                color: #333;
            }
            .list-group-item {
                border: none;
                padding-left: 0;
            }
            .github-link {
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container mt-5">
            <div class="card">
                <div class="card-body">
                    <h1 class="card-title">Google Cloud Study Jam Leaderboard API</h1>
                    <p class="card-text">Here are the available endpoints:</p>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">
                            <strong>Leaderboard:</strong> Retrieve the leaderboard data.
                            <br>Method: POST
                            <br>Path: /leaderboard
                        </li>
                        <li class="list-group-item">
                            <strong>Group Scores:</strong> Retrieve group-wise scores.
                            <br>Method: POST
                            <br>Path: /group-scores
                        </li>
                    </ul>
                    <div>
                        <p class="text-center text-muted">Go through the README in GitHub for more details</p>
                    </div>
                    <div class="mt-4 github-link">
                        <a href="https://github.com/zameel7/GCSJLeaderboard" class="btn btn-dark" target="_blank">
                            <i class="fab fa-github"></i> GitHub Repository (zameel7/GCSJLeaderboard)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Include Bootstrap 4 JS and jQuery (optional) -->
        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.5.2/dist/js/bootstrap.min.js"></script>
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
        // Check if the secret key is provided in the request body
        const { secret } = req.body;
        if (secret !== process.env.API_SECRET) {
            // If the provided secret key doesn't match, return an unauthorized response
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { sheets } = await authSheets();

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
        // Check if the secret key is provided in the request body
        const { secret } = req.body;
        if (secret !== process.env.API_SECRET) {
            // If the provided secret key doesn't match, return an unauthorized response
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        const { sheets } = await authSheets();

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
