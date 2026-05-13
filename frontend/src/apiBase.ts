/** Removes trailing slashes so BASE + '/auth/...' never becomes '//auth'. */
export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');
}
