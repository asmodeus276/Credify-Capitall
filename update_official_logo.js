import fs from 'fs';
import path from 'path';

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

const ejsFiles = walkDir('./views').filter(f => f.endsWith('.ejs'));

for (const file of ejsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('logo-mark.svg') || content.includes('logo-mark.png')) {
    content = content.replaceAll('logo-mark.svg', 'logo-official.png').replaceAll('logo-mark.png', 'logo-official.png');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
