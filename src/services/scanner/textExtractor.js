/**
 * Text Extractor Module (FINAL FIXED VERSION)
 */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");

class TextExtractor {

  static async extractFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    try {
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
    } catch (error) {
      throw new Error(`Error extracting from file: ${error.message}`);
    }
  }

  /* ================= PDF ================= */
  static async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      let fullText = data.text || "";

      // 🔥 CLEAN TEXT (VERY IMPORTANT)
      fullText = this.cleanText(fullText);

      console.log("🔥 EXTRACTED TEXT PREVIEW:", fullText.slice(0, 300));

      return {
        text: fullText,
        pages: this._divideIntoPages(fullText),
        fileType: "pdf",
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /* ================= DOCX ================= */
  static async extractFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });

      let fullText = result.value || "";

      fullText = this.cleanText(fullText);

      return {
        text: fullText,
        pages: this._divideIntoPages(fullText),
        fileType: "docx",
      };
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }

  /* ================= TXT ================= */
  static async extractFromTXT(filePath) {
    try {
      let fullText = fs.readFileSync(filePath, "utf-8");

      fullText = this.cleanText(fullText);

      return {
        text: fullText,
        pages: this._divideIntoPages(fullText),
        fileType: "txt",
      };
    } catch (error) {
      throw new Error(`TXT extraction failed: ${error.message}`);
    }
  }

  /* ================= URL ================= */
  static async extractFromURL(url) {
    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const contentType = response.headers["content-type"] || "";

      if (contentType.includes("pdf")) {
        const data = await pdfParse(response.data);

        let fullText = this.cleanText(data.text);

        return {
          text: fullText,
          pages: this._divideIntoPages(fullText),
          fileType: "pdf",
        };
      }

      if (contentType.includes("text")) {
        let fullText = response.data.toString("utf-8");

        fullText = this.cleanText(fullText);

        return {
          text: fullText,
          pages: this._divideIntoPages(fullText),
          fileType: "txt",
        };
      }

      throw new Error(`Unsupported URL content type: ${contentType}`);

    } catch (error) {
      throw new Error(`URL extraction failed: ${error.message}`);
    }
  }

  /* ================= 🔥 CLEAN TEXT ================= */
  static cleanText(text) {
    return text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ") // remove extra spaces
      .replace(/[^\x20-\x7E]/g, "") // remove weird chars
      .toLowerCase()
      .trim();
  }

  /* ================= PAGINATION ================= */
  static _divideIntoPages(fullText) {
    const pageSize = 3000;
    const pages = [];

    if (!fullText || fullText.length === 0) {
      return [{ pageNumber: 1, text: "" }];
    }

    let pageNum = 1;
    for (let i = 0; i < fullText.length; i += pageSize) {
      pages.push({
        pageNumber: pageNum++,
        text: fullText.substring(i, i + pageSize),
      });
    }

    return pages;
  }
}

module.exports = TextExtractor;