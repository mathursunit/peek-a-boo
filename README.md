# Peak-a-Boo Monitor

Peak-a-Boo Monitor is a lightweight, real-time web application designed to monitor the status and latency of various service endpoints. With a modern, "glassmorphism" inspired interface, it provides instant visual feedback on the health of your URLs.

## Features

- **Real-time Monitoring**: Checks the status (Online/Offline) and response time (latency) of configured URLs.
- **Visual Dashboard**: 
  - Status indicators (Green for Online, Red for Offline).
  - Live progress bar during checks.
  - Summary metrics (Total, Online, Offline counts).
- **Maintenance Mode**: Toggle individual services into "Maintenance" mode to exclude them from error counts.
- **Smart Filtering**: Filter the list by All, Online, or Offline status.
- **CSV Export**: Export the current monitoring results to a CSV file for reporting.
- **Dual Mode Support**:
  - **Localhost**: Uses a Node.js backend for full-featured monitoring (accurate status codes, unblocked cross-origin checks).
  - **Static Mode**: Can run as a static site (e.g., GitHub Pages) with some limitations due to browser CORS policies.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 14.0.0 or higher recommended).
- **npm**: Usually comes installed with Node.js.

## Installation

1.  **Clone or Download** this repository to your local machine.
2.  Navigate to the project directory in your terminal:
    ```bash
    cd monitor
    ```
3.  **Install Dependencies**:
    Run the following command to install the required Node.js packages (`express`, `axios`, `cors`):
    ```bash
    npm install
    ```

## Usage

### 1. Start the Server
Run the following command to start the application:

```bash
node server.js
```

You should see the message:
`Server running at http://localhost:7070`

### 2. Access the Dashboard
Open your web browser and navigate to:
[http://localhost:7070](http://localhost:7070)

### 3. Operating the Monitor
*   **Run Checks**: The monitor will automatically run checks on load. Click "Run Checks" to manually refresh.
*   **Toggle Maintenance**: Click the "Wrench" icon next to any service to toggle Maintenance mode.
*   **Export**: Click the "CSV" button to download a report.

## Configuration

To add, remove, or change the URLs being monitored, edit the `public/script.js` file.

1.  Open `public/script.js` in your code editor.
2.  Locate the `rawUrls` array at the top of the file:
    ```javascript
    const rawUrls = [
        "https://digitalservices.carrier.com/",
        "www.doccentral.carrier.com",
        "https://io.carrier.com/",
        // Add your URLs here
    ];
    ```
3.  Add or remove URLs as needed.
4.  Save the file and refresh your browser.

## Troubleshooting

*   **Port In Use**: If you see an error that port `7070` is busy, you can change the `PORT` variable in `server.js`.
*   **CORS / Network Errors**: In "Static Mode" (viewing `index.html` directly without the Node server), many sites may appear as "Unreachable" due to browser security policies (CORS). For reliable results, always run the project using `node server.js`.
