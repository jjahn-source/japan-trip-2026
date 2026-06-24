# Japan Trip 2026: Live Data Enhancements

## Purpose
The goal is to transition the application from a static planning tool into a dynamic, "live" on-the-ground companion by integrating real-time data for theme parks, transit, weather, and dining reservations. Since the application is hosted on GitHub Pages, the architecture relies exclusively on client-side fetching of public, CORS-friendly APIs and backend scraping via GitHub Actions saving static JSON to the `public/` directory.

## Architecture & Implementation

### 1. Theme Parks (Live Wait Times)
*   **Data Source:** [ThemeParks.wiki API](https://api.themeparks.wiki/)
*   **Method:** Client-side `fetch` in the browser.
*   **Implementation:**
    *   Create a custom hook `useThemeParkTimes(parkId)`.
    *   Integrate into the `Itinerary` component. If the current day includes a known theme park (Tokyo Disneyland, DisneySea, USJ), fetch and display a drawer or inline list of live wait times for rides.

### 2. Transit (Real-Time Train Delays)
*   **Data Source:** [Tetsudo Delay API](https://rti-giken.jp/fhc/api/train_tetsudo/delay.json)
*   **Method:** Client-side `fetch` in the browser.
*   **Implementation:**
    *   Create a global state or hook (`useTrainDelays`).
    *   Parse the JSON response to check for major line delays (e.g., Yamanote, Shinkansen, Chuo).
    *   If delays are detected, render a prominent warning banner globally (e.g., in the `Nav` or `Dashboard` components).

### 3. Weather (JMA Severe Weather & Alerts)
*   **Data Source:** Japan Meteorological Agency (JMA) Static JSON endpoints (e.g., `https://www.jma.go.jp/bosai/warning/data/warning/130000.json` for Tokyo).
*   **Method:** Client-side `fetch` in the browser.
*   **Implementation:**
    *   Extend existing weather components (or `WeatherWidget`) to pull from JMA.
    *   Display severe weather, heatstroke, or earthquake advisories as high-priority badges or alerts on the dashboard.

### 4. Dining (Reservation Sniper)
*   **Data Source:** Hard-to-book websites (e.g., Pokémon Cafe, Kirby Cafe, Omakase platforms).
*   **Method:** Server-side scraping via GitHub Actions and Playwright.
*   **Implementation:**
    *   Create a script `scripts/refresh-dining-sniper.mjs`.
    *   Configure Playwright to navigate the booking site, check specific dates/times, and extract availability.
    *   Run this script via `.github/workflows/auto-update.yml` every 30-60 minutes.
    *   Save the results to `public/dining-alerts.json`.
    *   The frontend app reads `dining-alerts.json` and displays a "BOOK NOW" notification if availability is found.

## Data Flow
1.  **Client-Side:** The React app mounts. Hooks fire off requests to ThemeParks.wiki, Tetsudo API, and JMA API. The state updates, rendering alerts and wait times natively.
2.  **Server-Side (Cron):** GitHub Actions fires `refresh-dining-sniper.mjs`. Playwright runs headless, scrapes the target URLs, and writes `public/dining-alerts.json`. A new commit is pushed. GitHub Pages re-deploys.
3.  **Client-Side (Polling):** The React app periodically fetches `/dining-alerts.json` (with cache-busting `?t=Date.now()`) to detect new reservations.

## Error Handling & Fallbacks
*   **Client-Side APIs:** All `fetch` calls must be wrapped in `try/catch` blocks. If an API goes down, times out, or changes its CORS policy, the app should silently fail and simply not display the live component (no broken UI).
*   **Playwright Scraper:** The scraping script must handle layout changes or captchas gracefully, exiting without failing the entire GitHub Action workflow, and ideally logging an error state to the JSON so the frontend knows the sniper is offline.

## Testing Strategy
*   Mock responses for the 3 client APIs to ensure UI components render correctly under different states (empty, error, populated with dummy data).
*   Run the Playwright script locally to verify it can successfully navigate and extract data before relying on the GitHub Action.