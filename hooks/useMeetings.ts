import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

// ─── useMeetings ─────────────────────────────────────────────────────────────

export interface Meeting {
  id: string;
  title: string;
  status: string;
  duration: number | null;
  createdAt: string;
  summary?: {
    tldr: string;
    actionItems: any[];
    topics: string[];
    sentiment: string;
  } | null;
  pdf?: { url: string; size: number; createdAt: string } | null;
  speakers: { id: string; label: string; talkTime: number; wordCount: number }[];
}

export function useMeetings() {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchMeetings = useCallback(
    async (page = 1, search?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params: any = { page, limit: 20 };
        if (search) params.q = search;
        const res = await axios.get("/api/meetings", { headers: authHeaders, params });
        setMeetings(res.data.meetings);
        setPagination(res.data.pagination);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch meetings");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const deleteMeeting = useCallback(
    async (id: string) => {
      await axios.delete(`/api/meetings/${id}`, { headers: authHeaders });
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    },
    [token]
  );

  const pollStatus = useCallback(
    async (id: string, onDone: (meeting: any) => void) => {
      const INTERVAL = 3000;
      const MAX_WAIT = 10 * 60 * 1000; // 10 min
      const start = Date.now();

      const poll = async () => {
        if (Date.now() - start > MAX_WAIT) return;
        try {
          const res = await axios.get(`/api/meetings/${id}`, { headers: authHeaders });
          const m = res.data.meeting;
          setMeetings((prev) => prev.map((x) => (x.id === id ? { ...x, ...m } : x)));
          if (m.status === "DONE") {
            onDone(m);
          } else if (m.status !== "FAILED") {
            setTimeout(poll, INTERVAL);
          }
        } catch {
          setTimeout(poll, INTERVAL * 2);
        }
      };

      setTimeout(poll, INTERVAL);
    },
    [token]
  );

  return { meetings, loading, error, pagination, fetchMeetings, deleteMeeting, pollStatus };
}

// ─── useUpload ────────────────────────────────────────────────────────────────

export interface UploadState {
  progress: number;
  status: "idle" | "uploading" | "creating" | "processing" | "done" | "error";
  error: string | null;
  meetingId: string | null;
}

export function useUpload() {
  const { token } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    status: "idle",
    error: null,
    meetingId: null,
  });

  const authHeaders = { Authorization: `Bearer ${token}` };

  const uploadMeeting = useCallback(
    async (file: File, title: string) => {
      setUploadState({ progress: 0, status: "uploading", error: null, meetingId: null });

      try {
        // 1. Get presigned S3 URL
        const presignRes = await axios.post(
          "/api/upload/presign",
          { filename: file.name, contentType: file.type, size: file.size },
          { headers: authHeaders }
        );
        const { uploadUrl, key } = presignRes.data;

        // 2. Upload directly to S3
        await axios.put(uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (evt) => {
            const pct = Math.round(((evt.loaded || 0) / (evt.total || 1)) * 100);
            setUploadState((prev) => ({ ...prev, progress: pct }));
          },
        });

        // 3. Create meeting record
        setUploadState((prev) => ({ ...prev, status: "creating", progress: 100 }));
        const meetingRes = await axios.post(
          "/api/meetings",
          { title, audioKey: key, audioSize: file.size },
          { headers: authHeaders }
        );
        const meetingId = meetingRes.data.meeting.id;

        // 4. Trigger processing pipeline
        setUploadState((prev) => ({ ...prev, status: "processing", meetingId }));
        await axios.post(`/api/meetings/${meetingId}/process`, {}, { headers: authHeaders });

        setUploadState((prev) => ({ ...prev, status: "processing", meetingId }));
        return meetingId;
      } catch (err: any) {
        const msg = err.response?.data?.error || "Upload failed";
        setUploadState({ progress: 0, status: "error", error: msg, meetingId: null });
        throw new Error(msg);
      }
    },
    [token]
  );

  const reset = () =>
    setUploadState({ progress: 0, status: "idle", error: null, meetingId: null });

  return { uploadState, uploadMeeting, reset };
}
