const fs = require('fs');
const path = require('path');

function getEjsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getEjsFiles(filePath, fileList);
        } else if (filePath.endsWith('.ejs')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = getEjsFiles('views/pages');
let fixedCount = 0;

for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    let uncommented = text.replace(/<!--[\s\S]*?-->/g, '');
    let open = (uncommented.match(/<div\b[^>]*>/g) || []).length;
    let close = (uncommented.match(/<\/div>/g) || []).length;
    
    if (open > close) {
        // We are missing a closing div!
        // Let's find the feedback form script injection
        const regex = /(<\/div>\s*)(<script nonce="<%= nonce %>" type="text\/javascript">\s*<\/script>)/;
        if (regex.test(text)) {
            let newText = text.replace(regex, '$1</div>\n      $2');
            
            // Check balance again
            let un2 = newText.replace(/<!--[\s\S]*?-->/g, '');
            let open2 = (un2.match(/<div\b[^>]*>/g) || []).length;
            let close2 = (un2.match(/<\/div>/g) || []).length;
            
            if (open2 === close2 || close2 === close + 1) {
                fs.writeFileSync(file, newText, 'utf8');
                console.log('Fixed', file, open, close, '->', open2, close2);
                fixedCount++;
            } else {
                console.log('Still unbalanced', file, open2, close2);
            }
        } else {
            console.log('Regex did not match', file);
        }
    } else if (open < close) {
        console.log('Extra closing div found in', file, open, close);
    }
}
console.log('Total fixed:', fixedCount);
