import { uploadBuffer } from "./s3";
import { v4 as uuidv4 } from "uuid";
import type { Meeting, Summary, Transcript, Speaker } from "@prisma/client";

export interface PDFMeetingData {
  meeting: Meeting & {
    summary: Summary | null;
    transcript: Transcript | null;
    speakers: Speaker[];
  };
  userName: string;
}

// Escape all user-provided strings before injecting into HTML
// Prevents XSS / HTML injection in the Puppeteer renderer
function esc(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHTML(data: PDFMeetingData): string {
  const { meeting, userName } = data;
  const summary = meeting.summary;
  const speakers = meeting.speakers;

  const actionItems = summary ? (summary.actionItems as any[]) : [];
  const keyPoints = summary ? (summary.keyPoints as string[]) : [];
  const decisions = summary ? (summary.decisions as string[]) : [];
  const topics = summary ? (summary.topics as string[]) : [];

  const durationStr = meeting.duration
    ? `${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s`
    : "—";

  const dateStr = new Date(meeting.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const speakersHTML = speakers
    .map(
      (s) => `
      <div class="speaker-row">
        <div class="speaker-avatar">${esc(s.label.slice(0, 2).toUpperCase())}</div>
        <div class="speaker-info">
          <div class="speaker-name">${esc(s.label)}</div>
          <div class="speaker-stat">${Math.floor(s.talkTime / 60)}m talk time · ${s.wordCount.toLocaleString()} words</div>
        </div>
        <div class="speaker-bar-wrap">
          <div class="speaker-bar" style="width: ${Math.min(100, (s.talkTime / (meeting.duration || 1)) * 100).toFixed(0)}%"></div>
        </div>
      </div>`
    )
    .join("");

  const actionItemsHTML = actionItems
    .map(
      (item: any) => `
      <div class="action-item priority-${esc(item.priority || "medium")}">
        <div class="action-check"></div>
        <div class="action-body">
          <div class="action-task">${esc(item.task)}</div>
          ${item.owner ? `<div class="action-meta">Owner: <strong>${esc(item.owner)}</strong></div>` : ""}
          ${item.dueDate ? `<div class="action-meta">Due: <strong>${esc(item.dueDate)}</strong></div>` : ""}
        </div>
        <span class="action-priority">${esc(item.priority || "medium")}</span>
      </div>`
    )
    .join("");

  const keyPointsHTML = keyPoints
    .map((p) => `<li class="key-point">${esc(p)}</li>`)
    .join("");

  const decisionsHTML = decisions
    .map((d) => `<div class="decision-item"><span class="decision-dot">◆</span>${esc(d)}</div>`)
    .join("");

  const topicsHTML = topics
    .map((t) => `<span class="topic-tag">${esc(t)}</span>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    color: #1a1916;
    background: #ffffff;
    padding: 0;
  }

  .page { padding: 52px 56px; max-width: 860px; margin: 0 auto; }
  
  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 2.5px solid #1a1916;
    margin-bottom: 32px;
  }
  .logo { font-size: 13px; font-weight: 700; letter-spacing: -0.3px; color: #1a1916; }
  .logo span { color: #c9a84c; }
  .header-meta { text-align: right; font-size: 11px; color: #888; line-height: 1.8; }

  .meeting-title { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
  .meeting-subtitle { font-size: 12px; color: #888; display: flex; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
  .meeting-subtitle span { display: flex; align-items: center; gap: 4px; }

  /* Topics */
  .topics { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 32px; }
  .topic-tag {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; padding: 4px 10px;
    background: #f5f0e8; color: #6b5c3a; border-radius: 99px;
  }

  /* TLDR */
  .tldr-block {
    background: #fafaf7; border-left: 3px solid #c9a84c;
    padding: 16px 20px; border-radius: 0 6px 6px 0;
    margin-bottom: 32px;
  }
  .section-label {
    font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px;
    color: #aaa; font-weight: 600; margin-bottom: 8px;
  }
  .tldr-text { font-size: 13px; line-height: 1.7; color: #333; }

  /* Sections */
  .section { margin-bottom: 32px; }
  .section-title {
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 1px; color: #888; padding-bottom: 8px;
    border-bottom: 1px solid #e8e4dc; margin-bottom: 14px;
  }

  /* Key points */
  .key-point {
    font-size: 12px; color: #333; line-height: 1.6;
    padding: 6px 0 6px 16px; list-style: none; position: relative;
    border-bottom: 0.5px solid #f0ede6;
  }
  .key-point::before {
    content: '→'; position: absolute; left: 0;
    color: #c9a84c; font-size: 11px;
  }

  /* Action items */
  .action-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 12px; border-radius: 6px;
    background: #f7f5f1; margin-bottom: 6px;
    border-left: 3px solid #e0dbd0;
  }
  .action-item.priority-high { border-left-color: #D85A30; }
  .action-item.priority-medium { border-left-color: #c9a84c; }
  .action-item.priority-low { border-left-color: #639922; }
  .action-check {
    width: 14px; height: 14px; border: 1.5px solid #c9a84c;
    border-radius: 3px; flex-shrink: 0; margin-top: 1px;
  }
  .action-body { flex: 1; }
  .action-task { font-size: 12px; font-weight: 500; color: #1a1916; margin-bottom: 3px; }
  .action-meta { font-size: 10px; color: #888; }
  .action-priority {
    font-size: 9px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 2px 7px; border-radius: 99px;
    background: #e8e4dc; color: #6b6860; flex-shrink: 0;
  }

  /* Decisions */
  .decision-item {
    font-size: 12px; color: #333; padding: 7px 0;
    border-bottom: 0.5px solid #f0ede6;
    display: flex; align-items: flex-start; gap: 8px; line-height: 1.5;
  }
  .decision-dot { color: #c9a84c; font-size: 8px; margin-top: 3px; flex-shrink: 0; }

  /* Speakers */
  .speaker-row {
    display: grid; grid-template-columns: 36px 1fr 120px;
    align-items: center; gap: 12px;
    padding: 8px 0; border-bottom: 0.5px solid #f0ede6;
  }
  .speaker-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #f5f0e8; display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 600; color: #6b5c3a;
  }
  .speaker-name { font-size: 12px; font-weight: 500; }
  .speaker-stat { font-size: 10px; color: #aaa; }
  .speaker-bar-wrap { height: 4px; background: #eee; border-radius: 99px; overflow: hidden; }
  .speaker-bar { height: 100%; background: #c9a84c; border-radius: 99px; }

  /* Transcript excerpt */
  .transcript-excerpt {
    background: #fafaf7; border-radius: 6px; padding: 16px 18px;
    font-size: 11px; line-height: 1.8; color: #555; max-height: 280px; overflow: hidden;
  }
  .seg-row { margin-bottom: 10px; }
  .seg-speaker { font-size: 10px; font-weight: 600; color: #c9a84c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .seg-time { font-size: 9px; color: #bbb; margin-left: 6px; }
  .seg-text { color: #444; }

  /* Footer */
  .footer {
    margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e4dc;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 10px; color: #bbb;
  }
  .footer-logo { font-size: 11px; font-weight: 700; color: #ccc; }
  .footer-logo span { color: #c9a84c; }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">Meeting<span>Memo</span></div>
    <div class="header-meta">
      Generated for ${esc(userName)}<br>
      ${esc(dateStr)}
    </div>
  </div>

  <h1 class="meeting-title">${esc(meeting.title)}</h1>
  <div class="meeting-subtitle">
    <span>⏱ ${esc(durationStr)}</span>
    <span>👥 ${speakers.length} speakers</span>
    <span>💬 ${meeting.transcript?.wordCount?.toLocaleString() || 0} words</span>
    <span>🌐 ${esc(meeting.language.toUpperCase())}</span>
  </div>

  ${topics.length ? `<div class="topics">${topicsHTML}</div>` : ""}

  ${
    summary?.tldr
      ? `<div class="tldr-block">
          <div class="section-label">TL;DR</div>
          <div class="tldr-text">${esc(summary.tldr)}</div>
        </div>`
      : ""
  }

  ${
    keyPoints.length
      ? `<div class="section">
          <div class="section-title">Key discussion points</div>
          <ul>${keyPointsHTML}</ul>
        </div>`
      : ""
  }

  ${
    actionItems.length
      ? `<div class="section">
          <div class="section-title">Action items (${actionItems.length})</div>
          ${actionItemsHTML}
        </div>`
      : ""
  }

  ${
    decisions.length
      ? `<div class="section">
          <div class="section-title">Decisions made</div>
          ${decisionsHTML}
        </div>`
      : ""
  }

  ${
    speakers.length
      ? `<div class="section">
          <div class="section-title">Speaker breakdown</div>
          ${speakersHTML}
        </div>`
      : ""
  }

  ${
    meeting.transcript
      ? `<div class="section">
          <div class="section-title">Transcript excerpt</div>
          <div class="transcript-excerpt">
            ${(meeting.transcript.segments as any[])
              .slice(0, 8)
              .map(
                (seg) => `
              <div class="seg-row">
                <div class="seg-speaker">${esc(seg.speaker)}<span class="seg-time">${esc(formatTime(seg.start))}</span></div>
                <div class="seg-text">${esc(seg.text)}</div>
              </div>`
              )
              .join("")}
          </div>
        </div>`
      : ""
  }

  <div class="footer">
    <div class="footer-logo">Meeting<span>Memo</span></div>
    <div>This report was auto-generated · meetingmemo.app</div>
  </div>
</div>
</body>
</html>`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function generateAndUploadPDF(
  data: PDFMeetingData
): Promise<{ s3Key: string; url: string; size: number }> {
  const html = buildHTML(data);

  let browser;

  try {
    const puppeteer = await import("puppeteer");
    browser = await (puppeteer as any).default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (err) {
    throw new Error(`Failed to launch browser for PDF generation: ${(err as Error).message}`);
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    const s3Key = `pdfs/${data.meeting.userId}/${data.meeting.id}/${uuidv4()}.pdf`;
    const url = await uploadBuffer(s3Key, Buffer.from(pdfBuffer), "application/pdf");
    const size = pdfBuffer.byteLength;

    return { s3Key, url, size };
  } catch (err) {
    await browser.close().catch(() => {});
    throw err;
  }
}
