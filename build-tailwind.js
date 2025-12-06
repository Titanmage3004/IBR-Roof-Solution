const fs = require('fs');
const postcss = require('postcss');
// Use the PostCSS plugin package for Tailwind. Newer Tailwind versions
// expect the `@tailwindcss/postcss` plugin when used with PostCSS programmatically.
const tailwind = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

async function build() {
  try {
    const inputPath = 'src/input.css';
    const outPath = 'css/tailwind.css';
    const input = fs.readFileSync(inputPath, 'utf8');
    // Use the project's Tailwind config (tailwind.config.cjs).
    // The tailwindcss PostCSS plugin is required above and will read
    // the configuration automatically during processing.
    const result = await postcss([
      tailwind(),
      autoprefixer()
    ]).process(input, { from: inputPath, to: outPath });
    fs.mkdirSync('css', { recursive: true });
    fs.writeFileSync(outPath, result.css);
    console.log('Built', outPath);
  } catch (err) {
    console.error('Build failed', (err && err.stack) || err);
    process.exit(1);
  }
}

build();
