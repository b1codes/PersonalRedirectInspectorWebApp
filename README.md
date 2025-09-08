# Redirect URI Inspector

The Redirect URI Inspector is a web-based tool designed to help developers inspect and understand the data passed to a page via its URL. This is particularly useful when working with OAuth 2.0 flows, SAML assertions, or any scenario where a page acts as a redirect target and needs to process query parameters or URL fragments.

This repository contains two versions of the application:

1.  **`main` branch:** A purely client-side application that can be deployed to static hosting services like GitHub Pages. It uses the browser's `localStorage` to persist inspection history.
2.  **`aws-deployment` branch:** A full-stack version that includes a serverless backend on AWS. In addition to the client-side features, it saves inspection data to a DynamoDB table via API Gateway and a Lambda function.

-----

## Demo

You can see screen recordings and screenshots of the app [here](https://brandonlc2020.github.io/Portfolio/project/3).

-----

## Features

  * **URL Parsing:** Displays the full URL, a list of query parameters, and the URL fragment for inspected URIs.
  * **Automated Inspection:**
      * By default, inspects the application's own `window.location.href` when it loads or changes.
      * **Configurable Default Monitored URL:** Users can set a persistent "default monitored URL". If set, and the application is opened without its own query parameters or fragment, this default URL will be inspected instead.
  * **Manual URL Inspection:** Allows users to input any URL directly into the application for immediate parsing and addition to the history.
  * **History Tracking:**
      * **Client-Side (`main` branch):** Stores a history of unique redirect entries in `localStorage`.
      * **Full-Stack (`aws-deployment` branch):** Stores history in `localStorage` and also saves each entry to a DynamoDB table in AWS for persistent, centralized logging.
  * **Reverse Chronological Order:** Shows the most recent entry at the top.
  * **Clear History:** Option to clear all stored redirect history from `localStorage`.
  * **Copy to Clipboard:**
      * Copy the auto-inspected URI.
      * Copy the full URL of any historical entry.
      * Copy all query parameters of an entry as a JSON object.
      * Copy the URL fragment of an entry.
  * **Responsive Design:** Adapts to various screen sizes for easy viewing on desktop and mobile.

-----

## How it Works

### Client-Side (`main` and `aws-deployment` branches)

When the page is loaded or its own URL changes:

1.  The application determines the URL to inspect:
      * It first checks `window.location.href`.
      * If `window.location.href` has significant query parameters or a fragment, this URL is chosen for inspection.
      * If `window.location.href` is "plain" (no significant query/fragment) AND a default custom URL has been set by the user (and stored in `localStorage`), that default custom URL is chosen for inspection.
      * Otherwise, the plain `window.location.href` is used.
2.  The chosen URL is parsed: its query string is broken into key-value pairs, and its fragment is extracted.
3.  A new entry containing this data, along with a timestamp, is created.
4.  This entry is added to a list of historical entries, which is then saved to `localStorage`.
5.  To avoid redundant entries from auto-inspection, a new record is only added if its content (full URL, query params, fragment) differs from the most recently logged entry.
6.  The history is displayed, with the latest entry appearing first.

### AWS Backend (`aws-deployment` branch)

The `aws-deployment` branch extends the client-side application with a serverless backend:

  * **API Call:** After a new redirect entry is created on the client, an asynchronous call is made to an AWS API Gateway endpoint, sending the new `RedirectData` object in the request body.
  * **Lambda Function:** The API Gateway endpoint triggers a Lambda function (`lambda-redirect-handler.ts`).
  * **Data Persistence:** The Lambda function validates the incoming data and then saves it as an item in a DynamoDB table. This allows for a persistent, long-term history of all redirects, independent of any single user's browser storage.

-----

## Tech Stack

  * **Frontend:**
      * **React 18**
      * **Vite**
      * **TypeScript**
      * **Material-UI (MUI):** For UI components.
  * **Backend (`aws-deployment` branch):**
      * **AWS Lambda:** For serverless compute.
      * **AWS API Gateway:** To create a RESTful API endpoint for the Lambda function.
      * **AWS DynamoDB:** As the NoSQL database for storing redirect history.
      * **AWS SDK for JavaScript v3:** Used in the Lambda function to interact with DynamoDB.

-----

## How to Run Locally

To run this application on your local machine, you'll need Node.js and npm installed.

1.  **Clone the repository and choose your branch:**

    ```bash
    git clone <repository-url>
    cd personalredirectinspectorwebapp

    # For the frontend-only version:
    git checkout main

    # For the full-stack AWS version:
    git checkout aws-deployment
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **View the App:**
    Open your browser and navigate to the URL provided by Vite (e.g., `http://localhost:5173/`).

-----

## How to Use

1.  **Automatic Inspection (as Redirect Target):**

      * Navigate to the application's URL in your browser.
      * To test its functionality as a redirect target, append query parameters and a URL fragment to its URL. For example: `http://localhost:5173/?name=JohnDoe&status=active#profileDetails`
      * The application will display the full URL, the parsed query parameters, and the fragment. This visit will be logged.

2.  **Set/Clear Default Monitored URL:**

      * In the header, find the "Set Default Monitored URL" section.
      * Enter a complete URL and click "Set as Default".
      * If a default URL is set, and you open the Redirect Inspector without any query parameters or hash in its own URL, it will automatically inspect your specified default URL.

3.  **Manually Inspect a Specific URL:**

      * In the header, find the "Manually Inspect Specific URL" section.
      * Enter any full URL you wish to examine and click "Inspect URL".

4.  **Viewing History:**

      * All inspected entries appear in the history list below the header.
      * The most recent entry is at the top.

5.  **Using "Copy" Buttons:**

      * Each data block has a "Copy" button to easily copy the respective data to your clipboard.

6.  **Clearing History:**

      * Use the "Clear History" button in the header to remove all logged entries from `localStorage`. **Note:** In the `aws-deployment` version, this does *not* delete entries from DynamoDB.

-----

## License

This project is licensed under the MIT License.
