import { QueryClient } from '@tanstack/react-query';

// One shared cache/config for every useQuery/useMutation in the app.
//
// - staleTime: 30s — this is an internal CRM, not a live feed. Most
//   screens share data (the client dropdown and the clients table both
//   read the same cache), so a short-but-nonzero staleTime avoids a
//   refetch every time a component mounts while still picking up
//   changes a moment later.
// - refetchOnWindowFocus: off — switching browser tabs shouldn't cause
//   list pages to flicker/reload; mutations already invalidate the
//   exact queries they affect.
// - retry: 1 — one retry smooths over a flaky request without turning a
//   real 4xx/5xx into a long silent wait.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
