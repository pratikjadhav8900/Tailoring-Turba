const fs = require('fs');
const filePath = 'src/lib/products-data.ts';
let content = fs.readFileSync(filePath, 'utf8');
// Replace price: "₹123" with price: 123
content = content.replace(/price: "₹(\d+)"/g, 'price: $1');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Done - replaced all price strings with numbers');
