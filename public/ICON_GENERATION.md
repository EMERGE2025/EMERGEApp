# PWA Icon Generation Guide

Your app is now configured as a PWA, but you need to generate the app icons.

## Required Icons

You need to create the following PNG icons from your `logo.svg`:

- `icon-192x192.png` (192x192 pixels)
- `icon-256x256.png` (256x256 pixels)
- `icon-384x384.png` (384x384 pixels)
- `icon-512x512.png` (512x512 pixels)

## Option 1: Online Tools (Easiest)

1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your `logo.svg` file
3. Download the generated icons
4. Place them in the `/public` folder

## Option 2: Using a Design Tool

1. Open `logo.svg` in a design tool (Figma, Photoshop, GIMP, etc.)
2. Export as PNG at the required sizes listed above
3. Save them in the `/public` folder

## Option 3: Using ImageMagick (Command Line)

If you have ImageMagick installed, run these commands from the project root:

```bash
# Install ImageMagick first if needed
# Ubuntu/Debian: sudo apt-get install imagemagick
# macOS: brew install imagemagick

cd public
magick convert logo.svg -resize 192x192 icon-192x192.png
magick convert logo.svg -resize 256x256 icon-256x256.png
magick convert logo.svg -resize 384x384 icon-384x384.png
magick convert logo.svg -resize 512x512 icon-512x512.png
```

## Testing Your PWA

After generating the icons:

1. Build your app: `npm run build`
2. Start the production server: `npm start`
3. Open in Chrome/Edge and look for the "Install" button in the address bar
4. On mobile, you can add to home screen from the browser menu

## Optional: Screenshots

For a better install experience, you can also create screenshots:
- `screenshot-wide.png` (1280x720 pixels) - for desktop
- `screenshot-mobile.png` (750x1334 pixels) - for mobile

These will be shown when users install your app.
