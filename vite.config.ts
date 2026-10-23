import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from "vite-plugin-svgr";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        svgr({
            // svgr options: https://react-svgr.com/docs/options/
            svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
            include: "**/*.svg",
        })
    ],
    resolve: {
        alias: {
            "@": r("./src"),
            "@dep": r("./src/lib"),
            "@pages": r("./src/pages"),
            "@routes": r("./src/routes"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                // Pecah vendor besar jadi chunk terpisah supaya `index` ramping
                // & cache lebih efektif (chart/maps/xlsx/icons hanya diunduh saat
                // halaman yang memakainya dibuka). Halaman sendiri sudah
                // code-split via dynamic import() di routes.
                manualChunks(id: string) {
                    if (!id.includes("node_modules")) return;
                    if (id.includes("maplibre-gl") || id.includes("supercluster"))
                        return "vendor-maps";
                    if (
                        id.includes("recharts") ||
                        /[\\/]d3-/.test(id) ||
                        id.includes("internmap") ||
                        id.includes("delaunator") ||
                        id.includes("robust-predicates") ||
                        id.includes("victory-vendor")
                    )
                        return "vendor-charts";
                    if (id.includes("xlsx")) return "vendor-xlsx";
                    if (id.includes("lucide-react")) return "vendor-icons";
                    if (
                        id.includes("react-select") ||
                        id.includes("@floating-ui") ||
                        id.includes("@emotion") ||
                        id.includes("memoize-one")
                    )
                        return "vendor-select";
                    if (
                        id.includes("react-hook-form") ||
                        id.includes("@hookform") ||
                        /[\\/]zod[\\/]/.test(id)
                    )
                        return "vendor-forms";
                    if (id.includes("react-router") || id.includes("@remix-run"))
                        return "vendor-router";
                    if (id.includes("react-dom")) return "vendor-react-dom";
                    if (id.includes("axios")) return "vendor-axios";
                    return "vendor";
                },
            },
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
})
