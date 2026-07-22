const fs = require('fs');
const path = require('path');

// 1. Build a map of lowercase to exact case for all files in img/
const imgMap = new Map();

function walkImg(dir, baseRoute = '') {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walkImg(fullPath, baseRoute + f + '/');
        } else {
            const relPath = baseRoute + f; // e.g. "inner-banners/bl-loan.svg"
            imgMap.set(relPath.toLowerCase(), relPath);
        }
    });
}
walkImg('img');

// 2. Walk views/ and fix paths
function walkViews(dir) {
    fs.readdirSync(dir).forEach(f => {
        const filePath = path.join(dir, f);
        if (fs.statSync(filePath).isDirectory()) {
            walkViews(filePath);
        } else if (filePath.endsWith('.ejs')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let newContent = content;

            // Fix ../ or ./
            newContent = newContent.replace(/href=["'](?:\.\.?\/)+([^"']+)["']/g, 'href="/$1"');
            newContent = newContent.replace(/src=["'](?:\.\.?\/)+([^"']+)["']/g, 'src="/$1"');

            // Fix relative hrefs
            newContent = newContent.replace(/href=["'](?!http|mailto:|tel:|#|\/)([^"']+)["']/g, 'href="/$1"');
            
            // Fix relative srcs
            newContent = newContent.replace(/src=["'](?!http|data:|\/)(.+?)["']/g, 'src="/$1"');

            // Fix image case sensitivity
            newContent = newContent.replace(/src=["']\/img\/([^"']+)["']/g, (match, p1) => {
                // p1 is like "Buy-new-machinery.svg"
                const lowerPath = p1.toLowerCase();
                if (imgMap.has(lowerPath)) {
                    return `src="/img/${imgMap.get(lowerPath)}"`;
                }
                return match; // Keep as is if not found (maybe it's a dynamic path or missing)
            });
            
            // Also fix srcset just in case
            newContent = newContent.replace(/srcset=["']\/img\/([^"']+)["']/g, (match, p1) => {
                const lowerPath = p1.toLowerCase();
                if (imgMap.has(lowerPath)) {
                    return `srcset="/img/${imgMap.get(lowerPath)}"`;
                }
                return match;
            });

            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log('Fixed', filePath);
            }
        }
    });
}

walkViews('views');
console.log('Done fixing paths and case sensitivity!');
