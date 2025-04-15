import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: parseInt(env.VITE_PORT || '3000'),
      strictPort: false,
      open: true,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif}'],
          maximumFileSizeToCacheInBytes: 3000000,
        },
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: "ERIO STUDIO - Gestão Financeira",
          short_name: "ERIO Gestão",
          description: "Sistema de gestão financeira para ERIO STUDIO DE ARQUITETURA",
          theme_color: "#009660",
          background_color: "#000000",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "images/icons/log_erio.ico.72x72.png",
              sizes: "72x72",
              type: "image/png"
            },
            {
              src: "images/icons/log_erio.ico",
              sizes: "192x192",
              type: "image/x-icon"
            }
          ]
        }
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    build: {
      sourcemap: true,
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
    }
  };
});
