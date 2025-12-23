# Deployment Guide for 3hoa.com

Since your project is built with Vite, you need to generate a production build and upload the resulting files to your web server.

## Step 1: Generate the Production Build

Run the following command in your terminal:

```bash
npm run build
```

This will create a `dist` folder in your project directory containing:
- `index.html`
- `assets/` (optimized JS and CSS files)

## Step 2: Upload to your Server

You can upload the files using one of these methods:

### Method A: cPanel File Manager (Recommended for beginner)
1. Log in to your **3hoa.com** hosting control panel (cPanel).
2. Open **File Manager**.
3. Navigate to `public_html` (or the folder where you want the chess app).
4. **Upload** the contents of the `dist` folder (do NOT upload the `dist` folder itself, just what's inside).

### Method B: FTP/SFTP
1. Use a client like **FileZilla**.
2. Connect to **3hoa.com**.
3. Upload the contents of your local `dist/` directory to the remote server directory.

## Step 3: Troubleshooting

- **White Screen?**: If you deploy to a subdirectory (e.g., `3hoa.com/chess/`), you must update `vite.config.js` to include `base: '/chess/'`.
- **Missing Images?**: Ensure all paths in your code are relative or correctly mapped to the production URL.

---
> [!TIP]
> Since you have GitHub set up, you could also use **GitHub Pages** or **Vercel** for free hosting and then point your `3hoa.com` domain (or a subdomain like `chess.3hoa.com`) to it.
