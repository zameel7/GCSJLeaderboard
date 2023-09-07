# Google Cloud Study Jam Cohort 1 Leaderboard API

![GitHub](https://img.shields.io/github/license/zameel7/GCSJLeaderboard)

## Overview

This API provides leaderboard data for the Google Cloud Study Jam Cohort 1 conducted from September 6, 2023, to October 2, 2023. It retrieves and formats data from Google Sheets to display the scores and progress of participants in the study jam.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Google Sheets Credentials](#google-sheets-credentials)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js
- npm (Node Package Manager)
- Google Sheets API Credentials
- `.env` File

### Installation

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/zameel7/GCSJLeaderboard.git
   ```

2. Install the required Node.js packages:

   ```bash
   cd GCSJLeaderboard
   npm install
   ```

## Usage

### API Endpoints

- `/leaderboard`: Retrieve the leaderboard data for the Google Cloud Study Jam Cohort 1. The data includes participant names, scores, completion status, and more.

   Example Request:

   ```http
   GET /leaderboard
   ```

   Example Response:

   ```json
   [
     {
       "name": "John Doe",
       "email": "johndoe@example.com",
       "score": 42,
       "isFinished": true,
       "hasRedeemed": false
     },
     {
       "name": "Jane Smith",
       "email": "janesmith@example.com",
       "score": 35,
       "isFinished": false,
       "hasRedeemed": true
     },
     // ...
   ]
   ```

## Configuration

### Project Setup

> To use the Google Sheets API, you need a Google Cloud Platform Project with the API enabled, as well as authorization credentials. To get those, follow the steps below.

- Step 1: Create a New Project

    - First, open the Google Cloud Console, and then create a new project.

- Step 2: Enable API and Services

    - At the top left, click Menu ☰ > APIs and Services > Enabled APIs and Services.

    - Then click on the + Enable APIs and Services button.

    - Search for Google Sheets API and enable it

- Step 3: Create a Service Account

    - Now that the API is enabled, it will direct you to a page where you can configure the settings for the API.

    - In the left sidebar, click on the Credentials tab, and then click the Create Credentials button at the top.

    - Next, select Service Account in the drop-down menu.

    - In the next screen, provide the service account details required; then, click Create and Continue.

    - Click Continue and Done respectively on the next two dialogs.

    - Now, your newly created service account will be on the credentials page.

    - Copy the email address of the service account to the clipboard, as we'll need it later to share the spreadsheet with this account.

    - You'll be directed to the next screen, where we'll create a new key. To do so, click on the Keys tab, and then click on the Add Key button.

    - Select the Create New Key option, and then the key type of JSON.

    - Lastly, rename the downloaded JSON file as ```keys.json```, and move it into your project folder. This keyfile contains the credentials of the service account that we need in our Node.js script to access the spreadsheet from Google Sheets.

> Reference: [Google Sheets API Tutorial: The Basics You Need to Get Going](https://stateful.com/blog/google-sheets-api-tutorial)

### Environment Variables

To run the API, create a `.env` file in the root directory of the project and add the following environment variables:

```env
SHEET_ID=your_google_sheets_sheet_id
API_SECRET=your_security_key
TYPE=service_account
PROJECT_ID=your_project_id
PRIVATE_KEY_ID=private_key_id
PRIVATE_KEY=private_key
CLIENT_EMAIL=client_email
CLIENT_ID=client_id
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
CLIENT_X509_CERT_URL=cert_url
UNIVERSE_DOMAIN=googleapis.com
```

> Find the ```SHEET_ID``` from the URL of your Google Sheet and the remaining from ```keys.json``` that you get while making a service account in Google cloud console

## Contributing

Contributions are welcome! Feel free to open issues or pull requests to improve this API.

## License

This project is licensed under the [MIT License](LICENSE).
