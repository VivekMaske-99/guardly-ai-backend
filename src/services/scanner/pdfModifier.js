const { PDFDocument, rgb } = require("pdf-lib");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

async function modifyPdf(pdfBase64, detections = [], action = "redact", extractedValues = {}) {
  const pdfBuffer = Buffer.from(pdfBase64, "base64");
  const pdfBytes = new Uint8Array(pdfBuffer);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;

  for (let pageIndex = 0; pageIndex < pdf.numPages; pageIndex++) {
    const page = pages[pageIndex];
    const pageHeight = page.getHeight();

    const pdfPage = await pdf.getPage(pageIndex + 1);
    const textContent = await pdfPage.getTextContent();

    const items = textContent.items;

    // ===============================
    // 🔥 GROUP ITEMS INTO LINES
    // ===============================
    const lines = [];

    items.forEach(item => {
      const transform = item.transform;
      const y = pageHeight - transform[5];

      let added = false;

      for (let line of lines) {
        if (Math.abs(line.y - y) < 10) {
          line.items.push(item);
          added = true;
          break;
        }
      }

      if (!added) {
        lines.push({ y, items: [item] });
      }
    });

    // ===============================
    // 🔍 MATCH FULL VALUE IN LINE
    // ===============================
    for (const value of Object.values(extractedValues)) {
      if (!value) continue;

      const val = value.toLowerCase().trim();
      if (val.length < 3) continue;

      for (const line of lines) {
        const lineText = line.items.map(i => i.str).join(" ").toLowerCase();

        if (lineText.includes(val)) {
          // 🔥 get bounding box of entire line
          const boxes = line.items.map(item => {
            const t = item.transform;

            const x = t[4];
            const yRaw = t[5];

            const height =
              Math.sqrt(t[2] ** 2 + t[3] ** 2) || 10;

            const y = pageHeight - yRaw - height;

            return {
              x,
              y,
              width: item.width,
              height,
            };
          });

          const minX = Math.min(...boxes.map(b => b.x));
          const maxX = Math.max(...boxes.map(b => b.x + b.width));
          const minY = Math.min(...boxes.map(b => b.y));
          const maxY = Math.max(...boxes.map(b => b.y + b.height));

          const padding = 3;

          page.drawRectangle({
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2,
            color: rgb(0, 0, 0),
          });
        }
      }
    }
  }

  const modifiedBytes = await pdfDoc.save();
  return Buffer.from(modifiedBytes).toString("base64");
}

module.exports = { modifyPdf };