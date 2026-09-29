import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const crmToken = env.CRM_TOKEN || env.VITE_CRM_TOKEN || 'M6JNcKxcNszQwNYZW';
  const crmUrl = env.CRM_URL || env.VITE_CRM_URL || 'https://macherbs.com/apileads/leads.php';
  const crmChannelId = env.CRM_CHANNEL_ID || env.VITE_CRM_CHANNEL_ID || 'AJ-DBT-SKM';
  const crmProductId = env.CRM_PRODUCT_ID || env.VITE_CRM_PRODUCT_ID || '52';
  const webhookUrl = env.GOOGLE_SHEET_WEBHOOK_URL || env.VITE_GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwGEiUeYDdVoJSgk_QfkarxmJ7FmgeyovJIxukkzHN-gizDbdDLRvMVbRbz_yxPdfVC/exec';

  return {
    envPrefix: ['VITE_', 'CRM_', 'GOOGLE_'],
    define: {
      'import.meta.env.CRM_TOKEN': JSON.stringify(crmToken),
      'import.meta.env.VITE_CRM_TOKEN': JSON.stringify(crmToken),
      'import.meta.env.CRM_URL': JSON.stringify(crmUrl),
      'import.meta.env.VITE_CRM_URL': JSON.stringify(crmUrl),
      'import.meta.env.CRM_CHANNEL_ID': JSON.stringify(crmChannelId),
      'import.meta.env.VITE_CRM_CHANNEL_ID': JSON.stringify(crmChannelId),
      'import.meta.env.CRM_PRODUCT_ID': JSON.stringify(crmProductId),
      'import.meta.env.VITE_CRM_PRODUCT_ID': JSON.stringify(crmProductId),
      'import.meta.env.GOOGLE_SHEET_WEBHOOK_URL': JSON.stringify(webhookUrl),
      'import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL': JSON.stringify(webhookUrl)
    }
  };
});
