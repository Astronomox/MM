"use client";
// app/dashboard/meetings/page.tsx — list with search, filter, pagination

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import {
  Card, Badge, Button, Avatar, Input, Eyebrow, Sep,
  statusTone, statusLabel, fmtDate, fmtDurShort,
} from "@/components/ui";

interface Meeting {
  id: string; title: string; status: string; duration: number | null;
  createdAt: string;
  speakers: { id: string; label: string }[];
  summary?: { tldr: string; topics: string[] } | null;
  pdf?: { url: string } | null;
}

export default function MeetingsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params: any = { page, limit: 20 };
    if (q.trim()) params.q = q.trim();
    axios.get("/api/meetings", { headers, params })
      .then((r) => {
        setMeetings(r.data.meetings);
        setPagination(r.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [token, page, q]);

  async function handleDelete(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await axios.delete(`/api/meetings/${id}`, { headers });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <AppShell
      title="Meetings"
      subtitle={`${pagination.total} total${q ? ` matching "${q}"` : ""}`}
      headRight={
        <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/upload")}>
          + New recording
        </Button>
      }
    >
      {/* Filter row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ maxWidth: 420, flex: 1 }}>
          <Input
            leadIcon={<span>⌕</span>}
            placeholder="Search titles, summaries…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
        </div>
        <Button variant="outline" size="md">Status</Button>
        <Button variant="outline" size="md">Any time</Button>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink3)" }}>
          {meetings.length > 0 && `Showing 1–${meetings.length} of ${pagination.total}`}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <Card padding={48} style={{ textAlign: "center", color: "var(--ink3)", fontSize: 13 }}>Loading…</Card>
      ) : meetings.length === 0 ? (
        <Card padding={56} style={{ textAlign: "center", border: "2px dashed var(--line2)" }}>
          <Eyebrow>Nothing here</Eyebrow>
          <p style={{ color: "var(--ink2)", fontSize: 15, margin: "10px 0 16px", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            {q ? "No meetings match that search." : "You haven't recorded anything yet."}
          </p>
          {!q && (
            <Button variant="primary" size="md" onClick={() => router.push("/dashboard/upload")}>
              Upload your first recording →
            </Button>
          )}
        </Card>
      ) : (
        <Card padding={0} style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--line)" }}>
                {[
                  { label: "Meeting", align: "left" },
                  { label: "Date", align: "left" },
                  { label: "Length", align: "right" },
                  { label: "Speakers", align: "right" },
                  { label: "Status", align: "left" },
                  { label: "", align: "right" },
                ].map((h, i) => (
                  <th key={i} style={{
                    textAlign: h.align as any,
                    padding: "10px 14px",
                    fontSize: 10.5, fontWeight: 500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "var(--ink3)",
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id}
                  onClick={() => router.push(`/dashboard/meetings/${m.id}`)}
                  style={{ borderTop: "1px solid var(--line-soft)", cursor: "pointer" }}
                >
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "var(--r-sm)",
                        background: "var(--accent-bg)", color: "var(--accent)",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 13,
                      }}>◎</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                          {m.title}
                        </div>
                        {m.summary?.tldr && (
                          <div style={{
                            fontSize: 12, color: "var(--ink3)", marginTop: 2,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            maxWidth: 420,
                          }}>{m.summary.tldr}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px", fontSize: 12.5, color: "var(--ink2)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {fmtDate(m.createdAt)}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink2)" }}>
                    {m.duration ? fmtDurShort(m.duration) : "—"}
                  </td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex" }}>
                      {m.speakers.slice(0, 3).map((s, j) => (
                        <span key={s.id} style={{ marginLeft: j === 0 ? 0 : -8 }}>
                          <Avatar name={s.label} size={22} />
                        </span>
                      ))}
                      {m.speakers.length > 3 && (
                        <span style={{
                          marginLeft: -8, width: 22, height: 22, borderRadius: "50%",
                          background: "var(--surface2)", border: "1.5px solid var(--surface)",
                          fontSize: 9.5, fontWeight: 600, color: "var(--ink3)",
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                        }}>+{m.speakers.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <Badge tone={statusTone(m.status)} size="sm">{statusLabel(m.status)}</Badge>
                  </td>
                  <td style={{ padding: "14px", textAlign: "right" }}>
                    <button
                      onClick={(e) => handleDelete(m.id, m.title, e)}
                      style={{
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: 4, color: "var(--ink-mute)", fontSize: 12,
                      }}
                      title="Delete"
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </Button>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink3)", padding: "0 14px" }}>
            {pagination.page} / {pagination.pages}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>
            Next →
          </Button>
        </div>
      )}
    </AppShell>
  );
}
