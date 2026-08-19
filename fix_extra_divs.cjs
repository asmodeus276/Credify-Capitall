const fs = require('fs');
const path = require('path');
const dir = 'views/pages';

let fixedFiles = 0;
fs.readdirSync(dir).forEach(file => {
    if(!file.endsWith('.ejs')) return;
    const filePath = path.join(dir, file);
    let text = fs.readFileSync(filePath, 'utf8');
    
    // The bug pattern is a div with class "row doc-wrap" that contains columns, 
    // ending with 3 closing </div>s when there should only be 2 because there is no IIFL_wrap.
    // The exact HTML ending looks like this:
    /*
                                            </div>

        							</div>

        					    </div>

							</div>
    */
    // We can use a regex to match the end of this block and remove the extra </div>.
    // Specifically, if there is a sequence of 4 closing </div> tags, we remove the third one.
    
    const pattern = /(<div class="row doc-wrap">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*)<\/div>\s*(<\/div>)/;
    
    // Wait, let's just make it simpler: find the exact sequence of 4 </div> tags with this spacing
    // and replace it with 3.
    // Let's first check if the file goes negative when ignoring comments:
    let uncommented = text.replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length));
    let unLines = uncommented.split('\n');
    let o = 0;
    let minO = 0;
    let drops = [];
    for(let i=0; i<unLines.length; i++) {
        const line = unLines[i];
        let open = (line.match(/<div\b[^>]*>/g) || []).length;
        let close = (line.match(/<\/div>/g) || []).length;
        o += open - close;
        if(o < minO) minO = o;
    }
    
    if (minO < 0) {
        // It's unbalanced! Let's find the extra closing tag inside tab-pane.
        // We know it drops below 2 inside tab-content, or drops below 0 overall.
        let o2 = 0;
        for (let i=0; i<unLines.length; i++) {
            const line = unLines[i];
            let open = (line.match(/<div\b[^>]*>/g) || []).length;
            let close = (line.match(/<\/div>/g) || []).length;
            o2 += open;
            
            for(let c=0; c<close; c++) {
                o2--;
                // If it drops to -1, THIS is the extra </div>!
                if(o2 < 0) {
                    console.log('File ' + file + ' goes negative at line ' + (i+1));
                    // Let's remove this </div>
                    let lines = text.split('\n');
                    lines[i] = lines[i].replace('</div>', '');
                    text = lines.join('\n');
                    fs.writeFileSync(filePath, text);
                    fixedFiles++;
                    o2 = 0; // Prevent infinite loop of fixing in this script run
                    break;
                }
            }
        }
    }
});

console.log('Fixed files: ' + fixedFiles);
