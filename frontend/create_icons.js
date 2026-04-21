const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const dir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.4)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KK', size / 2, size / 2);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(dir, `icon-${size}x${size}.png`), buffer);
    console.log(`Created icon-${size}x${size}.png`);
}

createIcon(192);
createIcon(512);
