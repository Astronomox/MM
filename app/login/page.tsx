"use client";
// app/login/page.tsx — split-screen sign-in, warm editorial

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button, Input, Field, Avatar, Eyebrow, Sep, Wordmark } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1.1fr 0.9fr",
      background: "var(--bg)",
      color: "var(--ink)",
      fontFamily: "var(--font-sans)",
    }}>
      {/* LEFT — form */}
      <div style={{ display: "flex", flexDirection: "column", padding: "32px 64px" }}>
        <Wordmark size={16} />

        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          maxWidth: 400, width: "100%", margin: "0 auto",
        }}>
          <Eyebrow>Welcome back</Eyebrow>
          <h1 style={{
            margin: "10px 0 8px",
            fontFamily: "var(--font-serif)", fontWeight: 500,
            fontSize: 38, letterSpacing: "-0.022em", color: "var(--ink)", lineHeight: 1.1,
          }}>
            Sign in to <em style={{ color: "var(--accent)", fontStyle: "italic" }}>MeetingMemo.</em>
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink3)", lineHeight: 1.55 }}>
            Good to see you. Drop straight back into your meetings.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{
                background: "var(--danger-bg)", color: "var(--danger)",
                fontSize: 13, padding: "10px 14px",
                borderRadius: "var(--r-md)", border: "1px solid var(--danger-bg)",
              }}>{error}</div>
            )}

            <Field label="Email">
              <Input
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                inputSize="lg"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                inputSize="lg"
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--ink2)", cursor: "pointer" }}>
                <input type="checkbox" />
                Stay signed in
              </label>
              <Link href="#" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" size="lg" full disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Signing in…" : "Sign in →"}
            </Button>

            <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 13, color: "var(--ink3)" }}>
              No account?{" "}
              <Link href="/register" style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}>
                Create one
              </Link>
            </p>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink3)" }}>
          <span>© 2026 MeetingMemo</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: "var(--ink3)" }}>Privacy</a>
            <a href="#" style={{ color: "var(--ink3)" }}>Terms</a>
          </div>
        </div>
      </div>

      {/* RIGHT — editorial panel */}
      <aside style={{
        background: "var(--accent-bg)",
        borderLeft: "1px solid var(--line)",
        padding: "48px 56px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <Eyebrow>Tonight's meeting</Eyebrow>

        <div>
          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 500,
            fontSize: 30, lineHeight: 1.25, letterSpacing: "-0.018em", color: "var(--ink)",
          }}>
            “The meeting was good, but I can't remember what we{" "}
            <span style={{ background: "linear-gradient(180deg, transparent 60%, var(--accent-line) 60%)", padding: "0 2px" }}>
              decided
            </span>
            .”
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: "var(--ink3)", letterSpacing: "-0.003em" }}>
            — Every person, on a Friday afternoon, since the invention of meetings.
          </div>

          <div style={{
            marginTop: 32,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)",
            padding: 20,
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <Eyebrow>What you get back</Eyebrow>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink3)" }}>~ 90s</span>
            </div>
            {[
              ["TL;DR", "One paragraph. The whole point."],
              ["Decisions", "Pulled out and listed."],
              ["Action items", "With owners and dates."],
              ["Searchable transcript", "Every word, every speaker."],
              ["A clean PDF", "Send it to whoever wasn't there."],
            ].map(([h, b], i) => (
              <div key={h} style={{
                display: "flex", gap: 12,
                padding: "8px 0",
                borderTop: i === 0 ? "none" : "1px dashed var(--line-soft)",
              }}>
                <span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{h}</div>
                  <div style={{ fontSize: 12, color: "var(--ink3)" }}>{b}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name="Pascal Olu" size={32} />
          <Avatar name="Sade Lin" size={32} />
          <Avatar name="Tom Hu" size={32} />
          <span style={{ fontSize: 12.5, color: "var(--ink3)" }}>
            <strong style={{ color: "var(--ink)", fontWeight: 600 }}>1,200+</strong> meetings memo'd this month
          </span>
        </div>
      </aside>
    </main>
  );
}
