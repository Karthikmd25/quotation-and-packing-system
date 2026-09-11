import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export const generateQuotationPDF = async (quotation) => {
  return new Promise(async (resolve, reject) => {
    try {
      /* =========================================================
         PDF DIRECTORY
      ========================================================= */

      const pdfDir = path.join(process.cwd(), "pdfs");

      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const fileName = `${quotation.quotationNumber}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      /* =========================================================
         UPI QR CODE
         
         IMPORTANT:
         The quotation Grand Total is automatically added
         to the QR code.

         Example:
         Grand Total = Rs. 12500

         QR contains:
         am=12500.00

         No "mam" parameter is used, so the amount is intended
         to be a fixed amount.
      ========================================================= */

      const upiId = "kickmacsolutions.ibz1@icici";
      const accountName = "KICKMAC SOLUTIONS";

      const grandTotal = Number(quotation.grandTotal || 0);

      if (!Number.isFinite(grandTotal) || grandTotal <= 0) {
        throw new Error(
          "Invalid grand total. QR code cannot be generated without a valid payment amount."
        );
      }

      const quotationNumber =
        String(quotation.quotationNumber || "").trim();

      const upiUrl =
        `upi://pay?pa=${encodeURIComponent(upiId)}` +
        `&pn=${encodeURIComponent(accountName)}` +
        `&am=${grandTotal.toFixed(2)}` +
        `&cu=INR` +
        `&tr=${encodeURIComponent(quotationNumber)}` +
        `&tn=${encodeURIComponent(
          `Quotation ${quotationNumber}`
        )}`;

      console.log("UPI QR generated for:");
      console.log("Quotation:", quotationNumber);
      console.log("Grand Total:", grandTotal);
      console.log("UPI URL:", upiUrl);

      const qrBuffer = await QRCode.toBuffer(upiUrl, {
        type: "png",
        width: 140,
        margin: 1,
        errorCorrectionLevel: "M",
      });

      /* =========================================================
         PDF DOCUMENT
      ========================================================= */

      const doc = new PDFDocument({
        size: "A4",
        margin: 30,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      const pageWidth = 595.28;
      const pageHeight = 841.89;

      const left = 30;
      const right = 565;
      const contentWidth = right - left;

      /* =========================================================
         HELPERS
      ========================================================= */

      const money = (value) => {
        return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
      };

      const safeText = (value) => {
        return String(value || "-");
      };

      /* =========================================================
         HEADER
      ========================================================= */

      const headerTop = 28;

      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(
          "KICKMAC SOLUTIONS",
          left,
          headerTop,
          {
            width: 300,
          }
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Chokkasandra, Peenya, Bengaluru, Karnataka 560057",
          left,
          headerTop + 25,
          {
            width: 330,
          }
        );

      doc.text(
        "Phone: 9900400452   |   Email: kickmacsales@gmail.com",
        left,
        headerTop + 38,
        {
          width: 350,
        }
      );

      doc.text(
        "State: Karnataka",
        left,
        headerTop + 51,
        {
          width: 200,
        }
      );

      /* =========================================================
         GST
      ========================================================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "GSTIN",
          430,
          headerTop + 2,
          {
            width: 135,
            align: "right",
          }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          "29EBPPS9045K1ZK",
          390,
          headerTop + 17,
          {
            width: 175,
            align: "right",
          }
        );

      /* =========================================================
         HEADER LINE
      ========================================================= */

      doc
        .moveTo(left, headerTop + 67)
        .lineTo(right, headerTop + 67)
        .stroke();

      /* =========================================================
         QUOTATION TITLE
      ========================================================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(
          "QUOTATION",
          left,
          headerTop + 76,
          {
            width: contentWidth,
            align: "center",
          }
        );

      /* =========================================================
         QUOTATION DETAILS
      ========================================================= */

      const detailsY = headerTop + 104;

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text(
          `Quotation No: ${safeText(
            quotation.quotationNumber
          )}`,
          left,
          detailsY,
          {
            width: 250,
          }
        );

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .text(
          `Date: ${new Date(
            quotation.createdAt || Date.now()
          ).toLocaleDateString("en-IN")}`,
          300,
          detailsY,
          {
            width: 265,
            align: "right",
          }
        );

      /* =========================================================
         CUSTOMER DETAILS
      ========================================================= */

      const customerTop = detailsY + 18;

      doc
        .roundedRect(
          left,
          customerTop,
          contentWidth,
          43,
          3
        )
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "CUSTOMER DETAILS",
          left + 8,
          customerTop + 6
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Name: ${safeText(
            quotation.customerName
          )}`,
          left + 8,
          customerTop + 20,
          {
            width: 170,
          }
        );

      doc.text(
        `Phone: ${safeText(
          quotation.customerPhone
        )}`,
        210,
        customerTop + 20,
        {
          width: 120,
        }
      );

      doc.text(
        `Email: ${safeText(
          quotation.customerEmail
        )}`,
        335,
        customerTop + 20,
        {
          width: 190,
        }
      );

      /* =========================================================
         PRODUCT DETAILS TITLE
      ========================================================= */

      const productTitleY = customerTop + 54;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(
          "PRODUCT DETAILS",
          left,
          productTitleY
        );

      /* =========================================================
         PRODUCT TABLE
         
         DO NOT CHANGE THESE COLUMNS
      ========================================================= */

      const tableTop = productTitleY + 15;

      const columns = {
        part: 30,
        product: 92,
        size: 235,
        colour: 285,
        qty: 355,
        unit: 385,
        price: 430,
        total: 500,
      };

      const items = Array.isArray(quotation.items)
        ? quotation.items
        : [];

      /* =========================================================
         TABLE HEADER
      ========================================================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(7.2)
        .text(
          "PART NO.",
          columns.part,
          tableTop
        )
        .text(
          "PRODUCT",
          columns.product,
          tableTop
        )
        .text(
          "SIZE",
          columns.size,
          tableTop
        )
        .text(
          "COLOUR",
          columns.colour,
          tableTop
        )
        .text(
          "QTY",
          columns.qty,
          tableTop
        )
        .text(
          "UNIT",
          columns.unit,
          tableTop
        )
        .text(
          "PRICE",
          columns.price,
          tableTop
        )
        .text(
          "TOTAL",
          columns.total,
          tableTop
        );

      doc
        .moveTo(left, tableTop + 13)
        .lineTo(right, tableTop + 13)
        .stroke();

      /* =========================================================
         PRODUCT ROWS
      ========================================================= */

      let currentY = tableTop + 18;

      const rowHeight =
        items.length > 12
          ? 16
          : items.length > 8
          ? 18
          : 20;

      const rowFont =
        items.length > 12
          ? 6.5
          : items.length > 8
          ? 7
          : 7.5;

      items.forEach((item) => {
        doc
          .font("Helvetica")
          .fontSize(rowFont)
          .text(
            safeText(item.partNumber),
            columns.part,
            currentY,
            {
              width: 58,
            }
          )
          .text(
            safeText(item.productName),
            columns.product,
            currentY,
            {
              width: 135,
              ellipsis: true,
            }
          )
          .text(
            safeText(item.size),
            columns.size,
            currentY,
            {
              width: 45,
            }
          )
          .text(
            safeText(item.colour),
            columns.colour,
            currentY,
            {
              width: 65,
            }
          )
          .text(
            String(item.quantity || 0),
            columns.qty,
            currentY,
            {
              width: 25,
              align: "center",
            }
          )
          .text(
            safeText(item.unit),
            columns.unit,
            currentY,
            {
              width: 40,
            }
          )
          .text(
            money(item.unitPrice),
            columns.price,
            currentY,
            {
              width: 65,
            }
          )
          .text(
            money(item.total),
            columns.total,
            currentY,
            {
              width: 65,
            }
          );

        currentY += rowHeight;
      });

      /* =========================================================
         TABLE BOTTOM
      ========================================================= */

      doc
        .moveTo(left, currentY + 2)
        .lineTo(right, currentY + 2)
        .stroke();

      /* =========================================================
         TOTALS + PAYMENT METHOD
      ========================================================= */

      const summaryTop = currentY + 10;

      /* Payment method */

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "PAYMENT METHOD",
          left,
          summaryTop
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          safeText(quotation.paymentMethod),
          left,
          summaryTop + 13,
          {
            width: 250,
          }
        );

      /* Transport */

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "TRANSPORT",
          left,
          summaryTop + 31
        );

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          safeText(quotation.transportMethod),
          left,
          summaryTop + 44,
          {
            width: 250,
          }
        );

      /* Totals */

      const totalX = 365;

      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Subtotal: ${money(
            quotation.subtotal
          )}`,
          totalX,
          summaryTop,
          {
            width: 200,
            align: "right",
          }
        );

      doc.text(
        `Discount: ${money(
          quotation.discount
        )}`,
        totalX,
        summaryTop + 13,
        {
          width: 200,
          align: "right",
        }
      );

      doc.text(
        `Packing & Forwarding: ${money(
          quotation.packingAndForwarding
        )}`,
        totalX,
        summaryTop + 26,
        {
          width: 200,
          align: "right",
        }
      );

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(
          `GRAND TOTAL: ${money(
            quotation.grandTotal
          )}`,
          totalX,
          summaryTop + 43,
          {
            width: 200,
            align: "right",
          }
        );

      /* =========================================================
         PAYMENT DETAILS + QR
      ========================================================= */

      const paymentTop = summaryTop + 70;

      doc
        .roundedRect(
          left,
          paymentTop,
          contentWidth,
          120,
          3
        )
        .stroke();

      /* =========================================================
         LEFT PAYMENT DETAILS
      ========================================================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          "PAYMENT DETAILS",
          left + 10,
          paymentTop + 8
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "PhonePe / Google Pay",
          left + 10,
          paymentTop + 24
        )
        .text(
          "Account Number: 343905001336",
          left + 10,
          paymentTop + 37
        )
        .text(
          "Account Holder: KICKMAC SOLUTIONS",
          left + 10,
          paymentTop + 50
        )
        .text(
          "Contact: 9844127247",
          left + 10,
          paymentTop + 63
        )
        .text(
          "IFSC Code: ICIC0003439",
          left + 10,
          paymentTop + 76
        )
        .text(
          "UPI ID: kickmacsolutions.ibz1@icici",
          left + 10,
          paymentTop + 89
        );

      /* =========================================================
         BANK DETAILS
      ========================================================= */

      const bankX = 265;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          "BANK DETAILS",
          bankX,
          paymentTop + 8
        );

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "Account Name: KICKMAC SOLUTIONS",
          bankX,
          paymentTop + 24
        )
        .text(
          "Account No: 343905001336",
          bankX,
          paymentTop + 37
        )
        .text(
          "IFSC: ICIC0003439",
          bankX,
          paymentTop + 50
        )
        .text(
          "Contact: 9844127247",
          bankX,
          paymentTop + 63
        )
        .text(
          "UPI: kickmacsolutions.ibz1@icici",
          bankX,
          paymentTop + 76
        );

      /* =========================================================
         QR CODE
         
         QR contains:
         - UPI ID
         - KICKMAC SOLUTIONS
         - Grand Total
         - INR
         - Quotation Number
      ========================================================= */

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "SCAN & PAY",
          465,
          paymentTop + 7,
          {
            width: 80,
            align: "center",
          }
        );

      doc.image(
        qrBuffer,
        475,
        paymentTop + 22,
        {
          width: 65,
          height: 65,
        }
      );

      doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .text(
          `Rs. ${grandTotal.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          462,
          paymentTop + 89,
          {
            width: 90,
            align: "center",
          }
        );

      doc
        .font("Helvetica")
        .fontSize(5.8)
        .text(
          "Google Pay / PhonePe",
          462,
          paymentTop + 99,
          {
            width: 90,
            align: "center",
          }
        );

      /* =========================================================
         REMARKS
      ========================================================= */

      const remarksTop = paymentTop + 130;

      if (quotation.quotationRemarks) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(
            "REMARKS:",
            left,
            remarksTop
          );

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .text(
            quotation.quotationRemarks,
            left + 48,
            remarksTop,
            {
              width: 465,
              height: 28,
              ellipsis: true,
            }
          );
      }

      /* =========================================================
         FOOTER
      ========================================================= */

      const footerY = pageHeight - 42;

      doc
        .moveTo(left, footerY - 10)
        .lineTo(right, footerY - 10)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(
          "Thank you for showing interest in KICKMAC SOLUTIONS.",
          left,
          footerY,
          {
            width: contentWidth,
            align: "center",
          }
        );

      /* =========================================================
         FINISH PDF
      ========================================================= */

      doc.end();

      stream.on("finish", () => {
        resolve({
          filePath,
          fileName,
        });
      });

      stream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      console.error(
        "Quotation PDF generation error:",
        error
      );

      reject(error);
    }
  });
};

