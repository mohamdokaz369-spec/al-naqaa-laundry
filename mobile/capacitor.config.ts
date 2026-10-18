import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.alnaqaa.laundry",
  appName: "النقاء",
  webDir: "dist",
  loggingBehavior: "none",
  experimental: {
    ios: {
      spm: {
        packageOptions: { "@capacitor-firebase/messaging": { symlink: true } },
      },
    },
  },
  plugins: {
    FirebaseMessaging: { presentationOptions: ["badge", "sound", "alert"] },
  },
};
export default config;
