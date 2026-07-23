const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const CleanCSS = require('clean-css');

function walkDir(dir, fileList = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirPath = path.join(dir, file);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, fileList);
    } else {
      fileList.push(dirPath);
    }
  });
  return fileList;
}

const logoDups = ['credify-exact-logo.png', 'credify-full-logo.png', 'credify-logo-footer.png', 'Credify Capital (1).png'];
// 'logo-mark.png' is our canonical logo

const bannerDups = ['banner-mobile.jpg', 'pl-debt-consolidation.jpg'];
// 'banner.jpg' is our canonical banner

const pathMap = {};

async function optimizeImages() {
  const imgFiles = walkDir('./img');
  
  // 1. Convert all JPGs to WebP and delete originals
  for (const file of imgFiles) {
    if (file.toLowerCase().endsWith('.jpg') && !bannerDups.includes(path.basename(file)) && path.basename(file) !== 'banner.jpg') {
      const parsed = path.parse(file);
      const newFile = path.join(parsed.dir, parsed.name + '.webp');
      try {
        console.log(`Converting ${file} -> ${newFile}`);
        await sharp(file).webp({ quality: 80 }).toFile(newFile);
        fs.unlinkSync(file);
        pathMap[parsed.base] = parsed.name + '.webp';
      } catch (err) {
        console.error(`Skipping conversion of ${file}:`, err.message);
      }
    }
  }

  // 2. Dedupe logos (just point to logo-mark.png)
  for (const dup of logoDups) {
    const found = imgFiles.find(f => path.basename(f) === dup);
    if (found && fs.existsSync(found)) fs.unlinkSync(found);
    pathMap[dup] = 'logo-mark.png';
    pathMap[encodeURIComponent(dup)] = 'logo-mark.png';
  }

  // 3. Dedupe banners
  let bannerTarget = 'banner.jpg';
  const primaryBanner = './img/banner.jpg';
  if (fs.existsSync(primaryBanner)) {
    try {
      await sharp(primaryBanner).webp({ quality: 80 }).toFile('./img/banner-main.webp');
      bannerTarget = 'banner-main.webp';
      fs.unlinkSync(primaryBanner);
      pathMap['banner.jpg'] = bannerTarget;
    } catch (e) {
      console.log('Could not convert banner.jpg, keeping original.');
    }
  }
  
  for (const dup of bannerDups) {
    const found = imgFiles.find(f => path.basename(f) === dup);
    if (found && fs.existsSync(found)) fs.unlinkSync(found);
    pathMap[dup] = bannerTarget;
  }

  console.log('Image optimization complete. Map:', pathMap);
}

async function updateReferences() {
  const ejsFiles = walkDir('./views').filter(f => f.endsWith('.ejs'));
  const cssFiles = walkDir('./css').filter(f => f.endsWith('.css'));
  const allFiles = [...ejsFiles, ...cssFiles];

  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    for (const [oldName, newName] of Object.entries(pathMap)) {
      const regex = new RegExp(`(/|'|"|\\b)${oldName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}`, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${newName}`);
        changed = true;
      }
    }
    
    // Convert remaining mapped jpg->webp using our pathMap specifically, so we don't blind-replace failed ones
    // We already handle it by iterating over pathMap! No need for the blind fallback anymore.

    if (changed) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }
  console.log('Updated all EJS and CSS references.');
}

function minifyCSS() {
  const cssFiles = walkDir('./css').filter(f => f.endsWith('.css'));
  for (const file of cssFiles) {
    const input = fs.readFileSync(file, 'utf8');
    const output = new CleanCSS({}).minify(input);
    fs.writeFileSync(file, output.styles, 'utf8');
    console.log(`Minified ${file}`);
  }
}

async function run() {
  try {
    await optimizeImages();
    await updateReferences();
    minifyCSS();
    console.log('All tasks completed successfully.');
  } catch (err) {
    console.error('Error during execution:', err);
  }
}

run();
