import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Static export (later):
 * Enable `output: "export"` in next.config.ts, then `npm run build` writes to ./out.
 * Run `npm run cap:sync` to copy assets into the Android project.
 *
 * Until static export is enabled, uncomment `server.url` below to load the Next dev
 * server from a device/emulator (use `npm run dev:lan` on port 3737).
 */
const config: CapacitorConfig = {
  appId: "com.masareefy.app",
  appName: "مصاريفي",
  webDir: "out",
  // server: {
  //   url: "http://192.168.1.100:3737",
  //   cleartext: true,
  // },
};

export default config;
