import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { generateUploadPresignedUrl } from "@/lib/s3";
import { checkMeetingLimit, logUsage } from "@/lib/limits";
import { z } from "zod";

const MAX_SIZE_BYTES = parseInt(process.env.MAX_AUDIO_SIZE_MB || "500") * 1024 * 1024;

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().regex(/^audio\//),
  size: z.number().max(MAX_SIZE_BYTES),
});

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = presignSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const withinLimit = await checkMeetingLimit(user.id, user.plan as any);
  if (!withinLimit) {
    return Response.json(
      { error: "Monthly meeting limit reached. Please upgrade your plan." },
      { status: 429 }
    );
  }

  const { filename, contentType, size } = parsed.data;

  try {
    const { uploadUrl, key } = await generateUploadPresignedUrl(
      user.id,
      filename,
      contentType
    );

    await logUsage(user.id, "UPLOAD", undefined, { filename, size });

    return Response.json({ uploadUrl, key });
  } catch (err) {
    console.error("Presign error:", err);
    return Response.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
