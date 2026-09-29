import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    envPrefix: ['VITE_', 'CRM_', 'GOOGLE_'],
    define: {
      'import.meta.env.CRM_TOKEN': JSON.stringify(env.CRM_TOKEN || env.VITE_CRM_TOKEN || ''),
      'import.meta.env.CRM_URL': JSON.stringify(env.CRM_URL || env.VITE_CRM_URL || ''),
      'import.meta.env.CRM_CHANNEL_ID': JSON.stringify(env.CRM_CHANNEL_ID || env.VITE_CRM_CHANNEL_ID || ''),
      'import.meta.env.CRM_PRODUCT_ID': JSON.stringify(env.CRM_PRODUCT_ID || env.VITE_CRM_PRODUCT_ID || ''),
      'import.meta.env.GOOGLE_SHEET_WEBHOOK_URL': JSON.stringify(env.GOOGLE_SHEET_WEBHOOK_URL || env.VITE_GOOGLE_SHEET_WEBHOOK_URL || '')
    }
  };
});
