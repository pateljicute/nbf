// Lightweight performance monitor - disabled to save bandwidth
export const perfMonitor = {
  trackPageLoad: (_pathname: string) => {},
  trackApiCall: (_endpoint: string, _duration: number) => {},
  trackError: (_error: Error) => {},
};
