// Helper untuk pattern MSW. Selalu pakai prefix "(any-host)/api/..." supaya:
// 1. Match request yang lewat AxiosKit dengan baseURL `/api`
// 2. TIDAK menangkap request Vite dev untuk file source (mis. /src/components/
//    accounts/AccountCard.tsx yang sebelumnya tertangkap pattern accounts/:id)
//
// Konsisten dengan proxy di `vite.config.ts` (/api -> http://localhost:5000).

export function endpoint(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `*/api${normalized}`;
}
