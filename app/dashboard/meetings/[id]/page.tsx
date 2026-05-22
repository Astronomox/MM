"use client";
// app/dashboard/meetings/[id]/page.tsx

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { Card, Badge, Button, Avatar, Progress, Eyebrow, statusTone, statusLabel, fmtDur, fmtDurShort, fmtDateLong } from "@/components/ui";

interface MeetingDetail {
  id: string; title: string; status: string; duration: number | null;
  createdAt: string; language: string;
  transcript: { fullText: string; segments: any[]; wordCount: number } | null;
  summary: {
    tldr: string; keyPoints: string[]; actionItems: any[];
    decisions: string[]; sentiment: string; topics: string[];
  } | null;
  pdf: { url: string; size: number; createdAt: string } | null;
  speakers: { id: string; label: string; talkTime: number; wordCount: number }[];
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  high:   { background: "var(--danger-bg)",  color: "var(--danger)" },
  medium: { background: "var(--warn-bg)",    color: "var(--warn)" },
  low:    { background: "var(--success-bg)", color: "var(--success)" },
};

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"summary" | "transcript">("summary");
  const [downloading, setDownloading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!id || !token) return;
    fetchMeeting();
  }, [id, token]);

  // Exponential backoff polling — starts at 3s, caps at 30s
  // Prevents hammering the API when processing takes a long time
  useEffect(() => {
    if (!meeting) return;
    if (["DONE", "FAILED"].includes(meeting.status)) return;

    let intervalMs = 3000;
    const MAX_INTERVAL = 30000;
    let timeout: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await axios.get(`/api/meetings/${id}`, { headers });
        setMeeting(res.data.meeting);
        if (["DONE", "FAILED"].includes(res.data.meeting.status)) return;
        intervalMs = Math.min(intervalMs * 1.5, MAX_INTERVAL);
      } catch {
        intervalMs = Math.min(intervalMs * 2, MAX_INTERVAL);
      }
      timeout = setTimeout(poll, intervalMs);
    };

    timeout = setTimeout(poll, intervalMs);
    return () => clearTimeout(timeout);
  }, [meeting?.status]);

  async function fetchMeeting() {
    try {
      const res = await axios.get(`/api/meetings/${id}`, { headers });
      setMeeting(res.data.meeting);
    } catch (e: any) {
      setError(e.response?.data?.error || "Meeting not found");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    setDownloading(true);
    try {
      const res = await axios.get(`/api/meetings/${id}/pdf`, { headers });
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = res.data.filename;
      a.click();
    } catch (e: any) {
      alert(e.response?.data?.error || "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <AppShell breadcrumbs={["Meetings", "Loading…"]}>
        <Card padding={48} style={{ textAlign: "center", color: "var(--ink3)", fontSize: 13 }}>Loading meeting…</Card>
      </AppShell>
    );
  }

  if (error || !meeting) {
    return (
      <AppShell breadcrumbs={["Meetings", "Not found"]}>
        <Card padding={48} style={{ textAlign: "center" }}>
          <p style={{ color: "var(--danger)", marginBottom: 16 }}>{error || "Meeting not found"}</p>
          <Button variant="outline" onClick={() => router.back()}>← Back</Button>
        </Card>
      </AppShell>
    );
  }

  const isProcessing = !["DONE", "FAILED"].includes(meeting.status);
  const PIPELINE = [
    { id: "TRANSCRIBING",    label: "Transcribing",    body: "Whisper is processing the audio" },
    { id: "SUMMARIZING",     label: "Summarizing",     body: "GPT-4o extracts decisions and action items" },
    { id: "GENERATING_PDF",  label: "Generating PDF",  body: "Rendering the final report" },
  ];

  return (
    <AppShell
      breadcrumbs={["Meetings", meeting.title]}
      contentMax={1140}
      headRight={
        <div style={{ display: "flex", gap: 8 }}>
          {meeting.pdf && (
            <Button variant="outline" size="sm" onClick={downloadPDF} disabled={downloading}>
              {downloading ? "Preparing…" : "↓ Download PDF"}
            </Button>
          )}
          <Button variant="primary" size="sm">✦ Ask this meeting</Button>
        </div>
      }
    >
      {/* ── Title block ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <Badge tone={statusTone(meeting.status)} size="sm">{statusLabel(meeting.status)}</Badge>
          {meeting.summary?.topics?.map(t => (
            <Badge key={t} tone="outline" size="sm">{t}</Badge>
          ))}
          {meeting.summary?.sentiment && (
            <Badge tone="accent" size="sm">{meeting.summary.sentiment} sentiment</Badge>
          )}
        </div>

        <h1 style={{
          margin: 0,
          fontFamily: "var(--font-serif)", fontWeight: 500,
          fontSize: 38, letterSpacing: "-0.022em", color: "var(--ink)", lineHeight: 1.1,
        }}>
          {meeting.title}
        </h1>

        <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: "var(--ink3)", fontFamily: "var(--font-mono)" }}>
          <span>{fmtDateLong(meeting.createdAt)}</span>
          {meeting.duration && <><span>·</span><span>{fmtDur(meeting.duration)}</span></>}
          {meeting.transcript && <><span>·</span><span>{meeting.transcript.wordCount.toLocaleString()} words</span></>}
          <span>·</span><span>{meeting.speakers.length} speakers</span>
          <span>·</span><span>{meeting.language.toUpperCase()}</span>
        </div>
      </div>

      {/* ── Processing state ── */}
      {isProcessing && (
        <Card padding={0} style={{ marginBottom: 24, border: "1px solid var(--accent-line)", background: "var(--accent-bg)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--accent-line)" }}>
            <Eyebrow style={{ color: "var(--accent)" }}>Processing pipeline</Eyebrow>
            <div style={{ fontSize: 13, color: "var(--ink3)", marginTop: 4 }}>
              This page updates automatically. You can also close it and come back.
            </div>
          </div>
          <div style={{ padding: "8px 0" }}>
            {PIPELINE.map((stage, i) => {
              const isDone = ["SUMMARIZING", "GENERATING_PDF", "DONE"].includes(meeting.status)
                ? stage.id === "TRANSCRIBING"
                : false;
              const isActive = meeting.status === stage.id;
              return (
                <div key={stage.id} style={{
                  display: "flex", gap: 14, padding: "14px 22px",
                  borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                  opacity: !isDone && !isActive ? 0.5 : 1,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: isDone ? "var(--accent)" : isActive ? "var(--surface)" : "var(--surface2)",
                    border: `1.5px solid ${isDone ? "var(--accent)" : isActive ? "var(--accent)" : "var(--line2)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isDone ? "white" : "var(--accent)",
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {isDone ? "✓" : isActive ? "●" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500, color: "var(--ink)" }}>{stage.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 2 }}>{stage.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {meeting.status === "FAILED" && (
        <div style={{
          background: "var(--danger-bg)", border: "1px solid var(--danger-bg)",
          borderRadius: "var(--r-md)", padding: "14px 18px", marginBottom: 24,
          fontSize: 13, color: "var(--danger)",
        }}>
          Processing failed. Please try uploading again.
        </div>
      )}

      {/* ── Tabs ── */}
      {(meeting.summary || meeting.transcript) && (
        <>
          <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--line)", marginBottom: 24 }}>
            {(["summary", "transcript"] as const).map(t => (
              <button
                key={t} onClick={() => setTab(t)}
                style={{
                  padding: "10px 16px", fontSize: 13.5, fontWeight: 500,
                  background: "none", border: "none", cursor: "pointer",
                  color: tab === t ? "var(--accent)" : "var(--ink3)",
                  borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
                  marginBottom: -1, textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── Summary tab ── */}
          {tab === "summary" && meeting.summary && (
            <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 24 }}>
              {/* Left */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* TL;DR */}
                <Card padding={0} style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-line)", borderLeft: "3px solid var(--accent)" }}>
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <Eyebrow style={{ color: "var(--accent)" }}>The whole point</Eyebrow>
                    </div>
                    <p style={{
                      margin: 0, fontFamily: "var(--font-serif)", fontStyle: "italic",
                      fontSize: 19, lineHeight: 1.5, color: "var(--ink)", letterSpacing: "-0.008em",
                    }}>
                      {meeting.summary.tldr}
                    </p>
                  </div>
                </Card>

                {/* Action items */}
                {meeting.summary.actionItems?.length > 0 && (
                  <Card padding={0}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between" }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18, letterSpacing: "-0.012em" }}>
                        Action items
                      </h3>
                      <Badge tone="outline" size="sm">{meeting.summary.actionItems.length}</Badge>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      {meeting.summary.actionItems.map((item: any, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "10px 20px", alignItems: "flex-start", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                          <div style={{
                            width: 14, height: 14, marginTop: 2,
                            border: "1.5px solid var(--accent-line)", borderRadius: "var(--r-sm)",
                            flexShrink: 0,
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{item.task}</div>
                            <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 11.5, color: "var(--ink3)" }}>
                              {item.owner && <span>Owner: <strong style={{ color: "var(--ink2)" }}>{item.owner}</strong></span>}
                              {item.dueDate && <span>Due: <strong style={{ color: "var(--ink2)" }}>{item.dueDate}</strong></span>}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                            padding: "2px 7px", borderRadius: 999,
                            ...PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium,
                          }}>
                            {item.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Decisions */}
                {meeting.summary.decisions?.length > 0 && (
                  <Card padding={0}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18, letterSpacing: "-0.012em" }}>
                        Decisions made
                      </h3>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      {meeting.summary.decisions.map((d: string, i: number) => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "10px 20px", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)", alignItems: "flex-start" }}>
                          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>◆</span>
                          <span style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Key points */}
                {meeting.summary.keyPoints?.length > 0 && (
                  <Card padding={0}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18 }}>Key points</h3>
                    </div>
                    <ul style={{ listStyle: "none", padding: "8px 0" }}>
                      {meeting.summary.keyPoints.map((p: string, i: number) => (
                        <li key={i} style={{ display: "flex", gap: 10, padding: "9px 20px", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)", alignItems: "flex-start" }}>
                          <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 3 }}>→</span>
                          <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Speakers */}
                {meeting.speakers.length > 0 && (
                  <Card padding={0}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-soft)" }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18 }}>Speakers</h3>
                    </div>
                    <div style={{ padding: "8px 0" }}>
                      {meeting.speakers.map((s, i) => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                          <Avatar name={s.label} size={32} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{s.label}</div>
                            <Progress value={Math.round((s.talkTime / (meeting.duration || 1)) * 100)} height={3} />
                          </div>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink3)" }}>
                            {Math.floor(s.talkTime / 60)}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ── Transcript tab ── */}
          {tab === "transcript" && meeting.transcript && (
            <Card padding={0}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 18 }}>Full transcript</h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink3)" }}>
                  {meeting.transcript.wordCount.toLocaleString()} words
                </span>
              </div>
              <div style={{ padding: "20px 24px", maxHeight: 600, overflowY: "auto" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(meeting.transcript.segments as any[]).map((seg, i) => (
                    <div key={i} style={{ display: "flex", gap: 16 }}>
                      <div style={{ width: 52, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink3)" }}>
                          {fmtTime(seg.start)}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                          {seg.speaker}
                        </div>
                        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.65 }}>{seg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
