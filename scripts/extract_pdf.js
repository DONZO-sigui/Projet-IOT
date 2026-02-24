const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const pdf = PDFParse;

async function extract() {
    const dataDir = path.join(__dirname, '../data');
    const pdfPath = path.join(dataDir, 'CNSHB-Bulletin_2024-18-05-2025-edition-1.pdf');
    const outputPath = path.join(dataDir, 'knowledge_base.json');

    console.log("Starting extraction for:", pdfPath);

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        console.log(`📄 Fichier PDF chargé : ${dataBuffer.length} octets`);

        const { PDFParse } = require('pdf-parse');
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();

        console.log(`✅ PDF extrait avec succès (${data.text.length} caractères)`);

        if (!data.text) {
            throw new Error("No text extracted from PDF");
        }

        // Clean text: remove excessive whitespace
        const cleanText = data.text.replace(/\s+/g, ' ').trim();
        console.log("Cleaned text length:", cleanText.length);

        // Simple chunking: split by sentences or fixed length (e.g., 500 chars)
        // For a bulletin, paragraphs are better, but let's try a safer split
        const chunks = [];
        const chunkSize = 800;
        for (let i = 0; i < cleanText.length; i += chunkSize) {
            chunks.push({
                id: chunks.length,
                content: cleanText.substring(i, i + chunkSize)
            });
        }

        const result = {
            metadata: {
                source: "CNSHB-Bulletin_2024-18-05-2025",
                extractedAt: new Date().toISOString(),
                totalPages: data.numpages,
                chunksCount: chunks.length
            },
            data: chunks
        };

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("SUCCESS: Knowledge base saved to", outputPath);

    } catch (err) {
        console.error("FATAL ERROR during extraction:");
        console.error(err.message);
        if (err.stack) console.error(err.stack);
    }
}

extract();
