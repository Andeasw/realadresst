# Real Identity Generator (Cloudflare Snippets)

A single-file Cloudflare Worker script that generates realistic fictional identities for testing purposes. It features a modern, real-world address validation, and automatic history logging.

## ✨ Features

*   **Real Address Generation:** Uses OpenStreetMap (Nominatim) to fetch valid real-world addresses and zip codes.
*   **Smart IP Location:** Automatically generates an identity near the visitor's physical location on the first load.
*   **Anime-Themed UI:** A responsive, glassmorphism interface with smooth animations and safe colors.
*   **Auto-Save History:** Automatically records generated identities to local storage without requiring manual saving.
*   **Security First:** Implements strict Content Security Policy (CSP), Nonce-based execution, and XSS protection.
*   **Mobile Friendly:** Fully responsive layout for desktop and mobile devices.

## 🛠️ APIs Used
*   **OpenStreetMap (Nominatim):** For reverse geocoding real coordinates.
*   **RandomUser.me:** For generating realistic names and profile data.
*   **UI Avatars:** For fallback profile pictures.

## 🚀 How to Deploy

1.  Log in to your **Cloudflare Dashboard**.
2.  Navigate to **Workers & Pages** -> **Create Application**.
3.  Create a standard **"Hello World" Worker**.
4.  Click **Edit Code**.
5.  Copy the entire content of `index.js` and paste it into the editor (replacing the existing code).
6.  Click **Deploy**.

## 📝 Usage

*   **Refresh:** Click the "Reroll Identity" button to generate a new persona.
*   **Country Selection:** Use the dropdown menu above the map to specific a country for the next generation.
*   **Copy Data:** Click on any field (Name, Phone, Address) to copy it to the clipboard.
*   **History:** Scroll down to view previously generated identities.

## ⚠️ Disclaimer
This tool is intended for **educational and testing purposes only** (e.g., populating test databases, UI testing). Do not use this tool for illegal activities.
