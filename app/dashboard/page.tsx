"use client";
// app/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { Card, Badge, Button, Avatar, Progress, Eyebrow, statusTone, statusLabel, fmtDurShort, fmtDate } from "@/components/ui";

interface Meeting {
  id: string; title: string; status: string; duration: number;
  createdAt: string; speakers: any[]; summary?: { tldr: string; topics: string[] } | null;
  pdf?: any;
}

interface Stats {
  stats: { totalMeetings: number; monthMeetings: number; totalTokens: number };
  limits: { meetingsPerMonth: number };
  plan: string;
  percentUsed: number;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    Promise.all([
      axios.get("/api/meetings?limit=5", { headers }),
      axios.get("/api/usage", { headers }),
    ]).then(([mRes, sRes]) => {
      setMeetings(mRes.data.meetings);
      setStats(sRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppShell
      title={<>{greeting()}, <em style={{ color: "var(--accent)", fontStyle: "italic" }}>{user?.name?.split(" ")[0] || "there"}</em>.</>}
      subtitle="Here's what your week sounded like."
      headRight={
        <Button variant="primary" size="sm" onClick={() => router.push("/dashboard/upload")}>
          + New recording
        </Button>
      }
    >
      {/* ── Stat row ── */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Meetings this month", value: `${stats.stats.monthMeetings}`, sub: `of ${stats.limits.meetingsPerMonth === 9999 ? "∞" : stats.limits.meetingsPerMonth} on ${stats.plan.toLowerCase()}` },
            { label: "Total meetings", value: `${stats.stats.totalMeetings}`, sub: "all time" },
            { label: "Tokens used", value: stats.stats.totalTokens.toLocaleString(), sub: "Whisper + GPT-4o" },
            { label: "Plan", value: stats.plan, sub: `${100 - stats.percentUsed}% remaining` },
          ].map(s => (
            <Card key={s.label} padding={18} hover>
              <Eyebrow style={{ marginBottom: 10 }}>{s.label}</Eyebrow>
              <div style={{
                fontFamily: "var(--font-serif)", fontWeight: 500,
                fontSize: 30, letterSpacing: "-0.025em", color: "var(--ink)", lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink3)" }}>{s.sub}</div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Usage bar ── */}
      {stats && stats.limits.meetingsPerMonth < 9999 && (
        <Card padding={20} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink2)" }}>Monthly usage</span>
            <Badge tone="accent" size="sm">{stats.stats.monthMeetings} / {stats.limits.meetingsPerMonth}</Badge>
          </div>
          <Progress value={stats.percentUsed} height={6} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11.5, color: "var(--ink3)" }}>{stats.stats.monthMeetings} used</span>
            <span style={{ fontSize: 11.5, color: "var(--ink3)" }}>{stats.limits.meetingsPerMonth - stats.stats.monthMeetings} remaining</span>
          </div>
        </Card>
      )}

      {/* ── Recent meetings ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 22, letterSpacing: "-0.015em", color: "var(--ink)", margin: 0 }}>
          Recent meetings
        </h2>
        <Button variant="link" size="sm" href="/dashboard/meetings">
          All meetings →
        </Button>
      </div>

      {loading ? (
        <Card padding={40} style={{ textAlign: "center", color: "var(--ink3)", fontSize: 13 }}>Loading…</Card>
      ) : meetings.length === 0 ? (
        <Card padding={56} style={{ textAlign: "center", border: "2px dashed var(--line2)" }}>
          <p style={{ color: "var(--ink3)", fontSize: 14, margin: "0 0 16px" }}>No meetings yet.</p>
          <Button variant="primary" size="md" onClick={() => router.push("/dashboard/upload")}>
            Upload your first recording
          </Button>
        </Card>
      ) : (
        <Card padding={0}>
          {meetings.map((m, i) => (
            <div
              key={m.id}
              onClick={() => router.push(`/dashboard/meetings/${m.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid var(--line-soft)",
                cursor: "pointer",
              }}
            >
              {/* Date */}
              <div style={{ width: 44, textAlign: "center", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {new Date(m.createdAt).getDate()}
                </div>
                <div style={{ fontSize: 9.5, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short" })}
                </div>
              </div>

              <div style={{ width: 1, height: 36, background: "var(--line-soft)", flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.005em" }}>{m.title}</span>
                  <Badge tone={statusTone(m.status)} size="sm">{statusLabel(m.status)}</Badge>
                </div>
                {m.summary?.tldr && (
                  <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.summary.tldr}
                  </p>
                )}
                <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 11.5, color: "var(--ink3)", fontFamily: "var(--font-mono)" }}>
                  <span>{fmtDurShort(m.duration || 0)}</span>
                  <span>·</span>
                  <span>{m.speakers?.length || 0} speakers</span>
                  {m.summary?.topics?.slice(0, 2).map(t => (
                    <span key={t}>· {t}</span>
                  ))}
                </div>
              </div>

              {m.pdf && (
                <Badge tone="accent" size="sm">PDF ready</Badge>
              )}
              <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>›</span>
            </div>
          ))}
        </Card>
      )}
    </AppShell>
  );
}
