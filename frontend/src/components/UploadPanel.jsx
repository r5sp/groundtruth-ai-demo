import { useState, useRef, useCallback, useEffect } from "react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".tiff", ".tif"];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

export default function UploadPanel({ onFileSelected, selectedFile, disabled, onOcrChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [useOcr, setUseOcr] = useState(false);
  const [ocrForced, setOcrForced] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedFile) {
      const ext = getFileExt(selectedFile.name);
      if (IMAGE_EXTENSIONS.includes(ext)) {
        setUseOcr(true);
        setOcrForced(true);
        onOcrChange?.(true);
      } else {
        setOcrForced(false);
      }
    } else {
      setUseOcr(false);
      setOcrForced(false);
    }
  }, [selectedFile]);

  const handleOcrChange = (value) => {
    if (ocrForced) return;
    setUseOcr(value);
    onOcrChange?.(value);
  };

  const validateFile = useCallback((file) => {
    const ext = getFileExt(file.name);
    const allAccepted = [...ACCEPTED_EXTENSIONS, ...IMAGE_EXTENSIONS];
    if (!allAccepted.includes(ext)) {
      return "Only PDF, DOCX, JPG, PNG, and TIFF files are supported.";
    }
    if (
      ACCEPTED_EXTENSIONS.includes(ext) &&
      file.type &&
      !ACCEPTED_TYPES.includes(file.type) &&
      file.type !== "application/octet-stream"
    ) {
      return "Invalid file type. Please upload a PDF or DOCX file.";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected, validateFile]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="card">
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png,.tiff,.tif"
          onChange={onInputChange}
          disabled={disabled}
        />
        <p className="upload-label">Drop your lease here</p>
        <p>or click to browse (PDF and DOCX supported)</p>
        <p className="file-types">One file at a time</p>
      </div>

      {error && (
        <div className="status-bar error" style={{ marginTop: "var(--fs-space-2)" }}>
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="file-info">
          <div>
            <strong>{selectedFile.name}</strong>
            <div className="meta">
              {selectedFile.type || "Document"} · {formatFileSize(selectedFile.size)}
            </div>
          </div>
        </div>
      )}

      {selectedFile && (
        <div style={{ marginTop: "var(--fs-space-3)" }}>
          <p style={{ fontWeight: 600, marginBottom: "var(--fs-space-2)" }}>
            Document format
          </p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
              cursor: ocrForced ? "not-allowed" : "pointer",
              opacity: ocrForced ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="ocr-mode"
              checked={!useOcr}
              onChange={() => handleOcrChange(false)}
              disabled={ocrForced}
            />
            Digital PDF / Word doc (text is selectable)
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: ocrForced ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="radio"
              name="ocr-mode"
              checked={useOcr}
              onChange={() => handleOcrChange(true)}
              disabled={ocrForced}
            />
            Scanned document / Image-based PDF (not text-selectable)
          </label>

          {useOcr && (
            <div
              style={{
                marginTop: "var(--fs-space-2)",
                padding: "0.75rem 1rem",
                backgroundColor: "#fffbeb",
                border: "1px solid #f59e0b",
                borderRadius: "6px",
                color: "#92400e",
                fontSize: "0.875rem",
                lineHeight: 1.5,
              }}
            >
              ⚠️ OCR processing is required for scanned documents. This takes 2 to 5 minutes longer than standard processing. Please be patient.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
