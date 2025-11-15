const fs = require('fs');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

async function build(){
  try{
    const inputPath = 'src/input.css';
    const outPath = 'css/tailwind.css';
    const input = fs.readFileSync(inputPath, 'utf8');
    const result = await postcss([
      tailwind({ content: ['./**/*.html', './js/**/*.js'] }),
      autoprefixer()
    ]).process(input, { from: inputPath, to: outPath });
    fs.mkdirSync('css', { recursive: true });
    fs.writeFileSync(outPath, result.css);
    console.log('Built', outPath);
  }catch(err){
    console.error('Build failed', err && err.stack || err);
    process.exit(1);
  }
}

build();
