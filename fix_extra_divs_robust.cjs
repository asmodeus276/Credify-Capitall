const fs = require('fs');
const path = require('path');
const dir = 'views/pages';

let fixedFiles = 0;
fs.readdirSync(dir).forEach(file => {
    if(!file.endsWith('.ejs')) return;
    const filePath = path.join(dir, file);
    let text = fs.readFileSync(filePath, 'utf8');
    
    // We only care about files that have "class=\"row doc-wrap\"" WITHOUT "IIFL_wrap"
    if (text.includes('class="row doc-wrap"') && !text.includes('class="IIFL_wrap"')) {
        let uncommented = text.replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length));
        let unLines = uncommented.split('\n');
        
        let o = 0;
        let foundExtra = false;
        let insideDocWrap = false;
        let docWrapDepth = 0;
        
        for (let i = 0; i < unLines.length; i++) {
            const line = unLines[i];
            let open = (line.match(/<div\b[^>]*>/g) || []).length;
            let close = (line.match(/<\/div>/g) || []).length;
            
            // Look for row doc-wrap
            if (line.includes('class="row doc-wrap"')) {
                insideDocWrap = true;
                docWrapDepth = o;
            }
            
            o += open;
            
            for (let c = 0; c < close; c++) {
                o--;
                // If we are inside doc wrap and it closes...
                if (insideDocWrap && o === docWrapDepth) {
                    insideDocWrap = false;
                    // The NEXT </div> is the extra one!
                    // Let's set a flag to delete the next </div>
                    foundExtra = true;
                } else if (foundExtra) {
                    // This is the extra </div>!
                    let lines = text.split('\n');
                    lines[i] = lines[i].replace('</div>', '');
                    text = lines.join('\n');
                    fs.writeFileSync(filePath, text);
                    fixedFiles++;
                    foundExtra = false;
                    o = 0; // stop parsing this file
                    break;
                }
            }
            if (!foundExtra && o === 0 && i > 0) {
                // If foundExtra was handled, it resets o to 0, so loop finishes safely.
            }
        }
    }
});

console.log('Fixed files: ' + fixedFiles);
