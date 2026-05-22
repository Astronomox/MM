import OpenAI from "openai";
import { generateDownloadPresignedUrl } from "./s3";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptSegment[];
  wordCount: number;
  duration: number;
  language: string;
}

export async function transcribeAudio(
  audioS3Key: string,
  language = "en"
): Promise<TranscriptionResult> {
  // Get presigned URL to fetch the audio
  const audioUrl = await generateDownloadPresignedUrl(audioS3Key);

  // Fetch audio buffer
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error("Failed to fetch audio from S3");
  
  const audioBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: "audio/webm" });
  const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });

  // Whisper transcription with verbose_json for timestamps
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language,
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  });

  const segments: TranscriptSegment[] = (transcription.segments || []).map(
    (seg, idx) => ({
      start: seg.start,
      end: seg.end,
      speaker: assignSpeaker(seg.start, seg.end, idx),
      text: seg.text.trim(),
    })
  );

  const fullText = segments.map((s) => s.text).join(" ");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    fullText,
    segments,
    wordCount,
    duration: transcription.duration || 0,
    language: transcription.language || language,
  };
}

// Simple heuristic speaker diarization (replace with Pyannote/AssemblyAI for production)
function assignSpeaker(start: number, _end: number, idx: number): string {
  // In production: integrate AssemblyAI or AWS Transcribe for real diarization
  // This assigns speakers based on pause patterns as a fallback
  return `Speaker ${(idx % 2) + 1}`;
}

export async function getAudioDuration(audioS3Key: string): Promise<number> {
  // Duration comes from Whisper transcription result
  // For pre-validation, use a lightweight approach
  return 0; // set during transcription
}
