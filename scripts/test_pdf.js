const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '../data/CNSHB-Bulletin_2024-18-05-2025-edition-1.pdf');

async function test() {
    console.log("Reading:", pdfPath);
    try {
        const buffer = fs.readFileSync(pdfPath);
        console.log("Buffer size:", buffer.length);
        const data = await pdf(buffer);
        console.log("Pages:", data.numpages);
        console.log("Text length:", data.text.length);
    } catch (err) {
        console.error("Error:", err);
    }
}
test();
