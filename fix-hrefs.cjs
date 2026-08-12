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
    if (content.includes('href="/javascript:')) {
        content = content.replace(/href="\/javascript:/g, 'href="javascript:');
        fs.writeFileSync(f, content, 'utf8');
        replaced++;
    }
});
console.log('Fixed ' + replaced + ' files.');
