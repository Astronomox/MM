-- Add indexes for frequently queried fields

-- Session lookups
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- Meeting list queries (most common: by user, sorted by date)
CREATE INDEX IF NOT EXISTS "Meeting_userId_idx" ON "Meeting"("userId");
CREATE INDEX IF NOT EXISTS "Meeting_userId_createdAt_idx" ON "Meeting"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Meeting_status_idx" ON "Meeting"("status");

-- Speaker lookups by meeting
CREATE INDEX IF NOT EXISTS "Speaker_meetingId_idx" ON "Speaker"("meetingId");

-- Usage log queries (monthly counts per user)
CREATE INDEX IF NOT EXISTS "UsageLog_userId_idx" ON "UsageLog"("userId");
CREATE INDEX IF NOT EXISTS "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");
