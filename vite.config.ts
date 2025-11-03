// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Detect đang chạy trong WSL
  const isWSL = !!process.env.WSL_DISTRO_NAME;

  return {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,

      // Fix watcher trên WSL
      watch: {
        usePolling: isWSL, // bật polling khi WSL
        interval: 100, // 50–200 tuỳ máy
      },

      // Fix HMR websocket khi truy cập từ Windows browser
      hmr: {
        host: "localhost", // hoặc đổi thành IP của WSL nếu cần
        clientPort: 3000, // khớp với server.port
      },
    },

    plugins: [react()],

    // ⚠️ Lưu ý: đừng nhét API key thật vào client
    // Vite chỉ expose biến bắt đầu bằng VITE_
    // Trên client dùng: import.meta.env.VITE_GEMINI_API_KEY (nếu bạn chấp nhận public)
    define: {
      "import.meta.env.VITE_GEMINI_API_KEY": JSON.stringify(
        env.VITE_GEMINI_API_KEY ?? ""
      ),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL ?? ""
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ?? ""
      ),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        "@assets": path.resolve(__dirname, "assets"),
      },
    },

    publicDir: "public",
  };
});
