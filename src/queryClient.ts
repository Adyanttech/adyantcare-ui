import { QueryClient } from '@tanstack/react-query';

// Shared so that sign-out can clear all cached data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 10_000 },
  },
});
