import { useCallback, useRef, useState } from "react";

const ALLOWED_EXTS = [".pdf", ".docx"];

function extOf(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

/**
 * Drop target for one file, or for a batch when `multiple` is set.
 *
 * With `multiple`, `onUpload` is called once per file, in the order they were
 * dropped, and awaited before the next one starts. Sequential rather than parallel
 * on purpose: each invoice upload re-reviews the whole project server-side, so
 * firing them at once would have them racing over the same ledger. One file failing
 * doesn't stop the rest - the failures are listed underneath afterwards.
 */
export default function UploadDropzone({ label, sublabel, onUpload, compact, multiple }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // {done, total, current}
  const [failures, setFailures] = useState([]); // [{name, error}]
  const [succeeded, setSucceeded] = useState(0);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList);
      if (!files.length) return;

      const bad = files.filter((f) => !ALLOWED_EXTS.includes(extOf(f.name)));
      const good = files.filter((f) => ALLOWED_EXTS.includes(extOf(f.name)));

      setBusy(true);
      setFailures(bad.map((f) => ({ name: f.name, error: "Only PDF and DOCX files are supported." })));
      setSucceeded(0);

      let ok = 0;
      const failed = [...bad.map((f) => ({ name: f.name, error: "Only PDF and DOCX files are supported." }))];
      for (const [i, file] of good.entries()) {
        setProgress({ done: i, total: good.length, current: file.name });
        try {
          await onUpload(file);
          ok += 1;
          setSucceeded(ok);
        } catch (err) {
          failed.push({ name: file.name, error: err.message || "Upload failed." });
          setFailures([...failed]);
        }
      }

      setProgress(null);
      setBusy(false);
      setFailures(failed);
      setSucceeded(ok);
    },
    [onUpload]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (busy) return;
    handleFiles(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]].filter(Boolean));
  };

  const onInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  let labelText = label;
  if (busy && progress && progress.total > 1) {
    labelText = `Uploading ${progress.done + 1} of ${progress.total} - ${progress.current}`;
  } else if (busy) {
    labelText = "Uploading...";
  }

  return (
    <div>
      <div
        className={`upload-zone ${compact ? "compact" : ""} ${dragOver ? "drag-over" : ""}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          multiple={!!multiple}
          onChange={onInputChange}
          disabled={busy}
        />
        <p className="upload-label">{labelText}</p>
        <p>{sublabel}</p>
      </div>

      {/* Report the batch outcome per file - a single "upload failed" line would hide
          which of five invoices actually went in. */}
      {!busy && multiple && succeeded > 0 && (
        <div className="status-bar" style={{ marginTop: "var(--fs-space-1)" }}>
          Added {succeeded} invoice{succeeded === 1 ? "" : "s"} to the billing sheet.
          {failures.length > 0 && ` ${failures.length} could not be read:`}
        </div>
      )}
      {!busy &&
        failures.map((f) => (
          <div key={f.name} className="status-bar error" style={{ marginTop: "var(--fs-space-1)" }}>
            {multiple ? `${f.name}: ${f.error}` : f.error}
          </div>
        ))}
    </div>
  );
}
