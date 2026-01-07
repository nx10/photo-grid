# Photo Grid

A minimal tool to tile and repeat images into a grid pattern. Upload an image, configure columns/rows/gap, and download as PNG or JPG.

![Photo Grid](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)

## Features

- Drag & drop or click to upload
- Adjustable columns, rows, and gap
- PNG or JPG export (with quality control)
- Live preview with async rendering
- Aspect ratio display for input and output

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

### 1. Create a new repository

```bash
# Initialize git in the project folder
cd photo-grid
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin git@github.com:YOUR_USERNAME/photo-grid.git
git branch -M main
git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to your repo on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Build and deployment**:
   - Source: **GitHub Actions**
4. That's it — the workflow will run automatically on push

### 3. Access your site

After the workflow completes (~1-2 min), your site will be live at:

```
https://nx10.dev/photo-grid/
```

## License

MIT — do whatever you want with it.
