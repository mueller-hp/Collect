# GitHub Pages Deployment Guide

## Setup Instructions

### 1. GitHub Repository Settings
1. Go to your repository: `https://github.com/mueller-hp/collect`
2. Navigate to **Settings** > **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
   - This will use the `.github/workflows/deploy.yml` file

### 2. Repository Structure
The following files have been configured for GitHub Pages deployment:

```
.github/workflows/deploy.yml    # GitHub Actions workflow
vite.config.ts                 # Updated with base path
src/App.tsx                    # Updated Router basename
public/404.html                # Client-side routing support
index.html                     # Updated with SPA routing script
```

### 3. Automatic Deployment
- Every push to the `main` branch will trigger automatic deployment
- The workflow will:
  1. Install dependencies (`npm ci`)
  2. Build the project (`npm run build`)
  3. Deploy to GitHub Pages

### 4. Manual Deployment
You can also trigger deployment manually:
1. Go to **Actions** tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button

### 5. Access Your App
Once deployed, your app will be available at:
```
https://mueller-hp.github.io/collect/
```

### 6. Local Development
For local development, the app will continue to work normally:
```bash
npm run dev
# App available at http://localhost:5173
```

## Configuration Details

### Base Path Configuration
- **Production**: `/collect/` (GitHub Pages subdirectory)
- **Development**: `/` (local server root)

### Client-Side Routing
- Uses `spa-github-pages` solution for proper routing on GitHub Pages
- 404.html redirects to index.html with proper path conversion
- Router configured with basename for production

### Build Settings
- Output directory: `dist/`
- Assets directory: `assets/`
- Sourcemaps disabled for production

## Troubleshooting

### If deployment fails:
1. Check the **Actions** tab for error details
2. Ensure all dependencies are listed in `package.json`
3. Verify the build command works locally: `npm run build`

### If routing doesn't work:
1. Ensure 404.html is in the public directory
2. Check that the Router basename is correctly configured
3. Verify the SPA script is included in index.html

### If styles don't load:
1. Check that assets are referenced with relative paths
2. Ensure the base path in vite.config.ts matches your repository name
3. Verify Tailwind CSS and other assets are properly bundled

## Security Notes
- The app runs entirely client-side on GitHub Pages
- No backend functionality or sensitive data should be included
- All data is stored locally in the browser's localStorage/sessionStorage