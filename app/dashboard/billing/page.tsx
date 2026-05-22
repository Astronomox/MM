"use client";
// app/dashboard/billing/page.tsx — plan + monthly usage + history

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import {
  Card, Badge, Button, Progress, Eyebrow,
  statusTone, statusLabel, fmtDate, fmtDurShort,
} from "@/components/ui";

interface Stats {
  stats: { totalMeetings: number; monthMeetings: number; totalTokens: number };
  limits: { meetingsPerMonth: number; maxAudioSizeMB: number; maxDurationMinutes: number };
  plan: string;
  percentUsed: number;
}

interface Meeting {
  id: string; title: string; status: string; duration: number | null;
  createdAt: string;
  pdf?: { url: string } | null;
}

const PLANS = [
  {
    name: "Free", price: "$0", per: "always",
    feats: ["5 meetings/mo", "60 min per recording", "PDF export", "All features"],
  },
  {
    name: "Pro", price: "$12", per: "per month, soon",
    feats: ["Unlimited meetings", "5 hr per recording", "Custom PDF branding", "API access", "Priority queue"],
  },
  {
    name: "Team", price: "$19", per: "per seat, soon",
    feats: ["Everything in Pro", "Shared workspace", "Roles & SSO", "Audit log", "Slack integration"],
  },
];

export default function BillingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      axios.get("/api/usage", { headers }),
      axios.get("/api/meetings?limit=10", { headers }),
    ]).then(([uRes, mRes]) => {
      setStats(uRes.data);
      setMeetings(mRes.data.meetings);
    });
  }, [token]);

  const currentPlan = stats?.plan?.toLowerCase() ?? "free";
  const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    .toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <AppShell
      title="Billing & plan"
      subtitle="You're on the Free plan. Everything below is free, forever, for as long as MeetingMemo is in beta."
    >
      {/* Current plan */}
      <Card padding={0} style={{ background: "var(--accent-bg)", borderColor: "var(--accent-line)", marginBottom: 20 }}>
        <div style={{ padding: "22px 26px", display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Badge tone="accent" size="sm">Current plan</Badge>
            <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 10 }}>
              <h2 style={{
                margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
                fontSize: 32, letterSpacing: "-0.02em", color: "var(--ink)", fontStyle: "italic",
                textTransform: "capitalize",
              }}>{currentPlan}</h2>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>· $0 / month</span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--ink2)", maxWidth: 460, lineHeight: 1.55 }}>
              5 meetings a month, 60 min per recording, all features included.
              We'll let you know before that ever changes.
            </p>
          </div>
          <div style={{ minWidth: 260 }}>
            <Eyebrow>This month</Eyebrow>
            {stats ? (
              <>
                <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{
                    fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 32,
                    color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1,
                  }}>{stats.stats.monthMeetings}</span>
                  <span style={{ fontSize: 14, color: "var(--ink3)" }}>
                    / {stats.limits.meetingsPerMonth === 9999 ? "∞" : stats.limits.meetingsPerMonth} meetings
                  </span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Progress value={stats.percentUsed} height={6} />
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink3)" }}>
                  Resets {resetDate}
                </div>
              </>
            ) : <Eyebrow style={{ marginTop: 6 }}>Loading…</Eyebrow>}
          </div>
        </div>
      </Card>

      {/* Other plans */}
      <Eyebrow style={{ marginBottom: 12 }}>Other plans (coming soon)</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {PLANS.map((p) => {
          const isCurrent = p.name.toLowerCase() === currentPlan;
          return (
            <Card
              key={p.name}
              padding={20}
              style={{
                borderColor: isCurrent ? "var(--accent)" : "var(--line)",
                borderWidth: isCurrent ? 1.5 : 1,
                opacity: isCurrent ? 1 : 0.85,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{p.name}</span>
                {isCurrent && <Badge tone="accent" size="sm">Current</Badge>}
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{
                  fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 28,
                  color: "var(--ink)", letterSpacing: "-0.022em", lineHeight: 1,
                }}>{p.price}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>{p.per}</div>
              <ul style={{ margin: "16px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                {p.feats.map((f) => (
                  <li key={f} style={{ display: "flex", gap: 8, fontSize: 12.5, color: "var(--ink2)" }}>
                    <span style={{ color: "var(--ink3)" }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Button
                variant={isCurrent ? "ghost" : "outline"}
                size="sm"
                full
                disabled={isCurrent}
                style={{ marginTop: 16 }}
              >
                {isCurrent ? "Current plan" : "Join waitlist"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* History */}
      <Card padding={0}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line-soft)" }}>
          <h3 style={{
            margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500,
            fontSize: 17, letterSpacing: "-0.015em", color: "var(--ink)",
          }}>Usage history</h3>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "var(--ink3)" }}>
            Last 30 days of meetings on this account.
          </p>
        </div>
        {meetings.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--ink3)", fontSize: 13 }}>
            No meetings yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
            <thead>
              <tr style={{ background: "var(--surface2)" }}>
                {[
                  { l: "Date", a: "left" },
                  { l: "Meeting", a: "left" },
                  { l: "Length", a: "right" },
                  { l: "Status", a: "left" },
                  { l: "", a: "right" },
                ].map((h, i) => (
                  <th key={i} style={{
                    textAlign: h.a as any,
                    padding: "10px 16px",
                    fontSize: 10.5, fontWeight: 500,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "var(--ink3)",
                  }}>{h.l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id} style={{ borderTop: "1px solid var(--line-soft)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--ink3)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                    {fmtDate(m.createdAt)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--ink)" }}>{m.title}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink3)" }}>
                    {m.duration ? fmtDurShort(m.duration) : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge tone={statusTone(m.status)} size="sm">{statusLabel(m.status)}</Badge>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/meetings/${m.id}`)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
