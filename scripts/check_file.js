const fs = require('fs');
const path = require('path');

const pdfPath = "c:\\Users\\Dell\\Desktop\\Licence 3\\Semestre 1\\IoT\\Projet\\Projet-IOT\\data\\CNSHB-Bulletin_2024-18-05-2025-edition-1.pdf";

try {
    console.log("Checking path:", pdfPath);
    if (fs.existsSync(pdfPath)) {
        const stats = fs.statSync(pdfPath);
        console.log("File exists. Size:", stats.size, "bytes");
        const fd = fs.openSync(pdfPath, 'r');
        const buffer = Buffer.alloc(10);
        fs.readSync(fd, buffer, 0, 10, 0);
        console.log("First 10 bytes (Hex):", buffer.toString('hex'));
        fs.closeSync(fd);
        console.log("File access OK.");
    } else {
        console.log("File NOT found at:", pdfPath);
    }
} catch (err) {
    console.error("Crash during file check:", err.message);
}
