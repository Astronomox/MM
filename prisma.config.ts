import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:ADEOLA@localhost:5432/meetingmemo",
  },
});