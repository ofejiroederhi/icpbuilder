import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

const HEADING_REGEX = /\*\*(.+?)\*\*/g;

const formatTimestamp = (date) =>
  date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const parseSections = (rawContent) => {
  if (!rawContent || !rawContent.trim()) {
    return [];
  }

  const matches = [...rawContent.matchAll(HEADING_REGEX)];
  if (matches.length === 0) {
    return [{ heading: "ICP Document", body: rawContent.trim() }];
  }

  return matches.map((match, index) => {
    const heading = match[1].trim();
    const bodyStart = match.index + match[0].length;
    const bodyEnd =
      index + 1 < matches.length ? matches[index + 1].index : rawContent.length;
    const body = rawContent.slice(bodyStart, bodyEnd).trim();

    return { heading, body };
  });
};

const splitBody = (body) => {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];
  let buffer = [];

  const flushParagraph = () => {
    if (buffer.length) {
      items.push({
        type: "paragraph",
        text: buffer.join(" "),
      });
      buffer = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("-")) {
      flushParagraph();
      items.push({
        type: "listItem",
        text: line.replace(/^-+\s*/, "").trim(),
      });
    } else {
      buffer.push(line);
    }
  }

  flushParagraph();
  return items;
};

function ICPOutput({ content, onReset }) {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");
  const [generatedAt] = useState(() => formatTimestamp(new Date()));

  const sections = useMemo(() => parseSections(content), [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      setCopied(false);
    }
  };

  const triggerDownload = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = () => {
    const safeContent = (content || "").trim();
    if (!safeContent) {
      return;
    }

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (downloadFormat === "txt") {
      const blob = new Blob([safeContent], { type: "text/plain;charset=utf-8" });
      triggerDownload(blob, `icp-report-${dateStamp}.txt`);
      return;
    }

    if (downloadFormat === "doc") {
      const escaped = safeContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");
      const docHtml = `<!doctype html><html><head><meta charset="utf-8"><title>ICP Report</title></head><body><h1>Your Ideal Customer Profile</h1><p>${escaped}</p></body></html>`;
      const blob = new Blob([docHtml], { type: "application/msword" });
      triggerDownload(blob, `icp-report-${dateStamp}.doc`);
      return;
    }

    if (downloadFormat === "pdf") {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const margin = 40;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Your Ideal Customer Profile", margin, y);
      y += 24;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const wrappedLines = pdf.splitTextToSize(safeContent, maxWidth);
      wrappedLines.forEach((line) => {
        if (y > 800) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 16;
      });

      pdf.save(`icp-report-${dateStamp}.pdf`);
    }
  };

  return (
    <section className="icp-output" aria-label="ICP Output">
      <header className="icp-output__header">
        <div className="icp-output__header-meta">
          <h2 className="icp-output__title">Your Ideal Customer Profile</h2>
          <p className="icp-output__timestamp">Generated: {generatedAt}</p>
        </div>
        <div className="icp-output__copy-wrap">
          <div className="icp-output__actions">
            <select
              className="icp-output__format-select"
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value)}
              aria-label="Select download format"
            >
              <option value="txt">TXT</option>
              <option value="doc">Word (.doc)</option>
              <option value="pdf">PDF</option>
            </select>
            <button
              type="button"
              className="icp-output__button icp-output__button--download"
              onClick={handleDownload}
            >
              Download
            </button>
            <button
              type="button"
              className="icp-output__button icp-output__button--copy"
              onClick={handleCopy}
            >
              Copy
            </button>
          </div>
          {copied ? <span className="icp-output__copied">Copied!</span> : null}
        </div>
      </header>

      <div className="icp-output__document">
        {sections.map((section) => {
          const blocks = splitBody(section.body);
          const listItems = blocks.filter((block) => block.type === "listItem");
          const paragraphs = blocks.filter((block) => block.type === "paragraph");

          return (
            <article className="icp-output__section" key={section.heading}>
              <h3 className="icp-output__section-title">{section.heading}</h3>

              {paragraphs.map((block) => (
                <p className="icp-output__paragraph" key={`${section.heading}-${block.text}`}>
                  {block.text}
                </p>
              ))}

              {listItems.length > 0 ? (
                <ul className="icp-output__list">
                  {listItems.map((item) => (
                    <li className="icp-output__list-item" key={`${section.heading}-${item.text}`}>
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          );
        })}
      </div>

      <footer className="icp-output__footer">
        <button
          type="button"
          className="icp-output__button icp-output__button--reset"
          onClick={onReset}
        >
          Back to Form
        </button>
      </footer>
    </section>
  );
}

export default ICPOutput;
