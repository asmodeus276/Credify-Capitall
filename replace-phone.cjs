const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.ejs') || file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('views');
let replaced = 0;
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('phone=919999406707')) {
        content = content.replace(/phone=919999406707/g, 'phone=919931372218');
        fs.writeFileSync(f, content, 'utf8');
        replaced++;
    }
});
console.log('Fixed ' + replaced + ' files with whatsapp phone number.');
