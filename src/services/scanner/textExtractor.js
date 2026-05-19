const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const Tesseract = require("tesseract.js"); // 🔥 OCR

class TextExtractor {
  static async extractFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case ".pdf":
        return await this.extractFromPDF(filePath);
      case ".docx":
        return await this.extractFromDOCX(filePath);
      case ".txt":
        return await this.extractFromTXT(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  static async extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    let fullText = data.text || "";

    // 🔥 OCR fallback
    if (!fullText || fullText.length < 50) {
      console.log("⚠️ Using OCR fallback...");
      const { data: ocr } = await Tesseract.recognize(filePath, "eng");
      fullText = ocr.text;
    }

    fullText = this.cleanText(fullText);

    console.log("🔥 EXTRACTED TEXT:", fullText.slice(0, 200));

    return {
      text: fullText,
      fileType: "pdf",
    };
  }

  static async extractFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return {
      text: this.cleanText(result.value),
      fileType: "docx",
    };
  }

  static async extractFromTXT(filePath) {
    const text = fs.readFileSync(filePath, "utf-8");
    return {
      text: this.cleanText(text),
      fileType: "txt",
    };
  }

  static cleanText(text) {
    return text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
  }
}

module.exports = TextExtractor;