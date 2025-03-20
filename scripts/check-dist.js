const fs = require('fs');
const path = require('path');

function checkDirectory(dir) {
    console.log(`\nChecking directory: ${dir}`);
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            console.log(`📁 ${item}/`);
            checkDirectory(fullPath);
        } else {
            console.log(`📄 ${item}`);
        }
    });
}

// Check dist directory
const distPath = path.join(__dirname, '..', 'dist');
console.log('\n=== Checking dist directory structure ===');
checkDirectory(distPath); 