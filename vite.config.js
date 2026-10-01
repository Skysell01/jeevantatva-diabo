import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const webhookUrl = env.GOOGLE_SHEET_WEBHOOK_URL || env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwGEiUeYDdVoJSgk_QfkarxmJ7FmgeyovJIxukkzHN-gizDbdDLRvMVbRbz_yxPdfVC/exec';

  return {
    envPrefix: ['VITE_', 'GOOGLE_'],
    define: {
      'import.meta.env.GOOGLE_SHEET_WEBHOOK_URL': JSON.stringify(webhookUrl),
      'import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL': JSON.stringify(webhookUrl)
    }
  };
});
