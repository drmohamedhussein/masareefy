import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const gitRevision = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf-8",
}).stdout?.trim();

const revision = gitRevision || crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/", revision },
      { url: "/expenses", revision },
      { url: "/calendar", revision },
      { url: "/analytics", revision },
      { url: "/settings", revision },
      { url: "/~offline", revision },
    ],
    swSrc: "sw/sw.ts",
    useNativeEsbuild: true,
  });
