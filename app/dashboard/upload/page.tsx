"use client";
// app/dashboard/upload/page.tsx — upload OR record live, multi-step pipeline

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUpload, useMeetings } from "@/hooks/useMeetings";
import AppShell from "@/components/AppShell";
import { Card, Button, Badge, Input, Field, Sep, Eyebrow, Progress } from "@/components/ui";

const ACCEPTED = /audio\/(mp3|mpeg|wav|webm|ogg|m4a|mp4)/;

function fmtTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function UploadPage() {
  const router = useRouter();
  const { uploadState, uploadMeeting, reset } = useUpload();
  const { pollStatus } = useMeetings();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED.test(f.type)) {
      alert("Please upload an audio file (MP3, WAV, WebM, M4A).");
      return;
    }
    setFile(f);
    setTitle((t) => t || f.name.replace(/\.[^/.]+$/, ""));
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const f = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        setFile(f);
        setTitle((t) => t || `Meeting recording — ${new Date().toLocaleDateString()}`);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert("Could not access microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    const meetingId = await uploadMeeting(file, title.trim());
    if (meetingId) {
      pollStatus(meetingId, () => {});
      router.push(`/dashboard/meetings/${meetingId}`);
    }
  }

  const isProcessing = ["uploading", "creating", "processing"].includes(uploadState.status);

  return (
    <AppShell breadcrumbs={["Meetings", "New recording"]} contentMax={680}>
      <div style={{ paddingTop: 8 }}>
        <Eyebrow>Step 1 of 1</Eyebrow>
        <h1 style={{
          margin: "10px 0 6px",
          fontFamily: "var(--font-serif)", fontWeight: 500,
          fontSize: 36, letterSpacing: "-0.022em", color: "var(--ink)",
        }}>
          Let's <em style={{ color: "var(--accent)", fontStyle: "italic" }}>memo</em> something.
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14.5, color: "var(--ink3)", lineHeight: 1.55 }}>
          Drop a file in, or hit record. We'll handle the rest.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Empty state — drop zone */}
          {!file && !recording && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? "var(--accent)" : "var(--line2)"}`,
                  borderRadius: "var(--r-xl)",
                  background: dragging ? "var(--accent-bg)" : "var(--surface)",
                  padding: "56px 32px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 120ms, background 120ms",
                }}
              >
                <div style={{
                  width: 56, height: 56,
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-line)",
                  borderRadius: "var(--r-lg)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  color: "var(--accent)", marginBottom: 16, fontSize: 22,
                }}>↑</div>
                <div style={{
                  fontFamily: "var(--font-serif)", fontWeight: 500,
                  fontSize: 18, color: "var(--ink)", letterSpacing: "-0.012em", marginBottom: 6,
                }}>
                  Drop an audio file here
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink3)" }}>
                  or <span style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "underline" }}>browse from your computer</span>
                </p>
                <div style={{ marginTop: 14, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                  {["MP3", "WAV", "WebM", "M4A", "OGG"].map((f) => (
                    <Badge key={f} tone="outline" size="sm">{f}</Badge>
                  ))}
                  <span style={{ fontSize: 11.5, color: "var(--ink3)", marginLeft: 4 }}>· up to 100MB on Free</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Sep style={{ flex: 1 }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink3)", letterSpacing: "0.08em" }}>
                  OR RECORD LIVE
                </span>
                <Sep style={{ flex: 1 }} />
              </div>

              <Card padding={28} style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink2)", lineHeight: 1.55 }}>
                  Recording in your browser — straight from your mic.<br />
                  <span style={{ color: "var(--ink3)", fontSize: 12.5 }}>Up to 60 minutes on Free</span>
                </p>
                <Button type="button" variant="primary" size="lg" onClick={startRecording}>
                  ● Start recording
                </Button>
              </Card>
            </>
          )}

          {/* Live recording */}
          {recording && (
            <Card padding={36} style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: "var(--danger)",
                  animation: "pulse 1.4s ease-in-out infinite",
                }} />
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                  color: "var(--danger)", letterSpacing: "0.08em",
                }}>RECORDING</span>
              </div>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 56, fontWeight: 500,
                color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: 1,
              }}>
                {fmtTime(recordingTime)}
              </div>

              <div style={{ marginTop: 28, height: 60, display: "flex", alignItems: "center", justifyContent: "center", gap: 2.5 }}>
                {Array.from({ length: 50 }, (_, i) => {
                  const h = 0.2 + 0.8 * Math.abs(Math.sin(i * 0.4 + recordingTime * 0.5) * Math.cos(i * 0.15));
                  return (
                    <div key={i} style={{ width: 3, height: `${h * 100}%`, background: "var(--accent)", borderRadius: 999 }} />
                  );
                })}
              </div>

              <div style={{ marginTop: 28, display: "flex", gap: 10, justifyContent: "center" }}>
                <Button type="button" variant="primary" size="lg" onClick={stopRecording}>
                  ⏹ Stop & process
                </Button>
              </div>
            </Card>
          )}

          {/* File ready */}
          {file && !isProcessing && (
            <>
              <Card padding={18} style={{ background: "var(--success-bg)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--r-md)",
                    background: "var(--surface)", border: "1px solid var(--line)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--ink)", fontSize: 18,
                  }}>♪</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.005em" }}>
                      {file.name}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "var(--ink3)", fontFamily: "var(--font-mono)" }}>
                      {(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type || "audio/*"}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); reset(); }}>
                    ✕ Remove
                  </Button>
                </div>
              </Card>

              <Field label="Meeting title" hint="We'll use this in the dashboard and the PDF.">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>

              <Card padding={16} style={{ background: "var(--surface2)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent)", marginTop: 2 }}>✦</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>What we'll do</div>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ink3)", lineHeight: 1.5 }}>
                      Transcribe with Whisper, identify speakers, summarize with GPT-4o, render a PDF.
                      Usually 1–3 minutes.
                    </p>
                  </div>
                </div>
              </Card>

              <Button type="submit" variant="primary" size="lg" full disabled={!title.trim()}>
                Upload & process →
              </Button>
            </>
          )}

          {/* Processing */}
          {isProcessing && (
            <Card padding={20} style={{ background: "var(--accent-bg)", borderColor: "var(--accent-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                  {uploadState.status === "uploading" ? "Uploading audio…"
                    : uploadState.status === "creating" ? "Creating meeting…"
                    : "Processing — transcribing & summarizing…"}
                </span>
                {uploadState.status === "uploading" && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--accent-hi)" }}>
                    {uploadState.progress}%
                  </span>
                )}
              </div>
              {uploadState.status === "uploading" && <Progress value={uploadState.progress} height={6} />}
              {uploadState.status === "processing" && (
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink3)" }}>
                  Sit tight — we'll redirect to the meeting page in a moment.
                </p>
              )}
            </Card>
          )}

          {uploadState.status === "error" && (
            <Card padding={16} style={{ background: "var(--danger-bg)" }}>
              <span style={{ color: "var(--danger)" }}>{uploadState.error}</span>
            </Card>
          )}
        </form>
      </div>
    </AppShell>
  );
}
