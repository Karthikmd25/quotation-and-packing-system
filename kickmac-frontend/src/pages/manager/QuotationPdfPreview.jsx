import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./QuotationPdfPreview.css";

export default function QuotationPdfPreview() {
  const { id } = useParams();

  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl = "";

    async function loadPdf() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Quotation ID is missing.");
        }

        const response = await api.get(
          `/quotations/${id}/pdf`,
          {
            responseType: "blob",
          }
        );

        const blob = new Blob(
          [response.data],
          {
            type: "application/pdf",
          }
        );

        objectUrl = URL.createObjectURL(blob);

        setPdfUrl(objectUrl);
      } catch (err) {
        console.error(
          "Quotation PDF preview error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Failed to load quotation PDF."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  async function handleDownload() {
    try {
      setDownloading(true);

      const response = await api.get(
        `/quotations/${id}/pdf`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const downloadUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = downloadUrl;

      link.download = `Quotation-${id}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(
        "Quotation PDF download error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to download quotation PDF."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="quotation-pdf-page">

      <header className="quotation-pdf-header">

        <div>
          <div className="pdf-brand">
            KICKMAC • SALES
          </div>

          <h1>
            Quotation PDF Preview
          </h1>

          <p>
            Review the quotation before downloading.
          </p>
        </div>

        <div className="pdf-header-actions">

          <Link
            to="/manager/quotations"
            className="pdf-back-button"
          >
            ← Back to Quotations
          </Link>

          <button
            type="button"
            className="pdf-download-button"
            onClick={handleDownload}
            disabled={
              loading ||
              downloading ||
              !pdfUrl
            }
          >
            {downloading
              ? "Downloading..."
              : "⬇ Download PDF"}
          </button>

        </div>

      </header>

      <main className="quotation-pdf-main">

        {loading && (
          <div className="pdf-loading">

            <div className="pdf-spinner"></div>

            <h2>
              Loading PDF...
            </h2>

            <p>
              Please wait while the quotation
              PDF is prepared.
            </p>

          </div>
        )}

        {error && !loading && (
          <div className="pdf-error">

            <div className="pdf-error-icon">
              ⚠️
            </div>

            <h2>
              Unable to load PDF
            </h2>

            <p>
              {error}
            </p>

            <Link
              to="/manager/quotations"
              className="pdf-back-button"
            >
              ← Back to Quotations
            </Link>

          </div>
        )}

        {!loading &&
          !error &&
          pdfUrl && (
            <div className="pdf-preview-container">

              <iframe
                src={pdfUrl}
                title="Quotation PDF Preview"
                className="quotation-pdf-frame"
              />

            </div>
          )}

      </main>

    </div>
  );
}