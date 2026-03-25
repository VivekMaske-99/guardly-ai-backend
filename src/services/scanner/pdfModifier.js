const { PDFDocument, rgb } = require("pdf-lib");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function modifyPdf(
  pdfBase64,
  detections = [],
  action = "redact",
  extractedValues = {}
) {
  // ✅ Convert Buffer → Uint8Array
  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  const pdfBytes = new Uint8Array(pdfBuffer);

  // ✅ Load PDF (drawing)
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // ✅ Load PDF (text extraction)
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  // ===============================
  // LOOP THROUGH PAGES
  // ===============================
  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    const pdfPage = await pdf.getPage(pageIndex + 1);
    const textContent = await pdfPage.getTextContent();

    for (const item of textContent.items) {
      const text = item.str.toLowerCase();

      for (const [key, value] of Object.entries(extractedValues)) {
        if (!value) continue;

        const val = value.toLowerCase().trim();

        // 🚫 Ignore small values
        if (val.length < 4) continue;

        // ===============================
        // 🔥 SMART MATCH (AI FRIENDLY)
        // ===============================
        let isMatch = false;

        // ✅ Exact match
        if (text.includes(val)) {
          isMatch = true;
        }

        // ✅ Fallback for split text
        else if (val.length > 6) {
          const parts = val.split(/[@\s.]/);

          isMatch = parts.some(
            (part) =>
              part.length > 3 &&
              !["gmail", "com", "india"].includes(part) &&
              text.includes(part)
          );
        }

        // ===============================
        // 🎯 APPLY REDACTION
        // ===============================
        if (isMatch) {
          const transform = item.transform;

          // ✅ Correct coordinates (FIXED)
          const x = transform[4];
          const yRaw = transform[5];

          // 🔥 Proper height calculation
          const height =
            Math.sqrt(transform[2] ** 2 + transform[3] ** 2) || 10;

          // 🔥 Correct Y conversion
          const y = pageHeight - yRaw - height;

          // 🔥 Controlled width (avoid full line)
          const width = Math.min(item.width, 200);

          /* ================= 🔴 REDACT ================= */
          if (action === "redact") {
            page.drawRectangle({
              x: x - 1,
              y: y - 1,
              width: width + 2,
              height: height + 2,
              color: rgb(0, 0, 0),
            });
          }

          /* ================= 🟡 HIGHLIGHT ================= */
          else if (action === "highlight") {
            page.drawRectangle({
              x,
              y,
              width,
              height,
              color: rgb(1, 1, 0),
              opacity: 0.4,
            });
          }

          /* ================= 🔳 MASK ================= */
          else if (action === "mask") {
            const boxSize = 6;

            for (let px = x; px < x + width; px += boxSize) {
              for (let py = y; py < y + height; py += boxSize) {
                page.drawRectangle({
                  x: px,
                  y: py,
                  width: boxSize,
                  height: boxSize,
                  color: rgb(0.8, 0.8, 0.8),
                });
              }
            }
          }
        }
      }
    }
  }

  const modifiedBytes = await pdfDoc.save();
  return Buffer.from(modifiedBytes).toString("base64");
}

module.exports = { modifyPdf };