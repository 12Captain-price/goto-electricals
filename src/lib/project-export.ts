// Helpers for exporting a portfolio project card as PNG/PDF and sharing it.
// Uses html-to-image to rasterize the card DOM node (html2canvas can't parse
// the oklch/oklab color functions Tailwind v4 emits, so we use a modern
// alternative instead), then either downloads the raster directly (PNG),
// wraps it in a single-page PDF (jsPDF), or hands it to the Web Share API
// alongside a link back to the site.

import type { Project } from "@/lib/site-store";

async function renderCardToDataUrl(node: HTMLElement): Promise<string> {
  const { toPng } = await import("html-to-image");
  return toPng(node, {
    backgroundColor: "#161b22",
    pixelRatio: 2,
    cacheBust: true,
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "project";
}

export async function downloadProjectPng(node: HTMLElement, project: Project) {
  const dataUrl = await renderCardToDataUrl(node);
  triggerDownload(dataUrl, `${slugify(project.title)}.png`);
}

export async function downloadProjectPdf(node: HTMLElement, project: Project) {
  const dataUrl = await renderCardToDataUrl(node);
  const { jsPDF } = await import("jspdf");

  // Need pixel dimensions to compute the right aspect ratio for the PDF page.
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load rendered image"));
    img.src = dataUrl;
  });

  const pageWidth = 210;
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;
  const ratio = img.height / img.width;
  const imgHeight = usableWidth * ratio;
  const pageHeight = Math.max(297, imgHeight + margin * 2);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  pdf.setFillColor(13, 17, 23);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.addImage(dataUrl, "PNG", margin, margin, usableWidth, imgHeight);
  pdf.save(`${slugify(project.title)}.pdf`);
}

type ShareResult = "shared" | "copied" | "unsupported";

export async function shareProject(
  node: HTMLElement,
  project: Project,
  siteUrl: string,
): Promise<ShareResult> {
  const shareUrl = `${siteUrl}#projects`;
  const text = `${project.title} — Go Electricals\n${project.description}`;

  // Try sharing with the rendered card image attached, where supported.
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      const dataUrl = await renderCardToDataUrl(node);
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], `${slugify(project.title)}.png`, { type: "image/png" });
      const filesPayload = { files: [file] };
      const canShareFiles =
        typeof navigator.canShare !== "function" || navigator.canShare(filesPayload);

      if (canShareFiles) {
        await navigator.share({
          title: project.title,
          text,
          url: shareUrl,
          files: [file],
        });
        return "shared";
      }

      // Fall back to a link-only share if file sharing isn't supported.
      await navigator.share({ title: project.title, text, url: shareUrl });
      return "shared";
    } catch (err) {
      // AbortError means the user cancelled the share sheet — not a failure.
      if (err instanceof Error && err.name === "AbortError") return "shared";
      // Otherwise fall through to clipboard copy below.
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    return "copied";
  }

  return "unsupported";
}