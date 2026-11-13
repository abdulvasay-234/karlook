import { RouteError, validateRouteRequest, validPlace, type DrivingRoute, type Place, type RouteProvider, type QuoteProvider, type QuoteRequest, type ServerQuote } from './types.ts';

export function createBackendRouteProvider(apiBase: string, request: typeof fetch = fetch, allowInsecureLocal = false): RouteProvider & QuoteProvider {
  const url = new URL(apiBase);
  if (url.username || url.password || url.search || url.hash || (url.protocol !== 'https:' && !(allowInsecureLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new RouteError('provider', 'Route service URL must be a public HTTPS endpoint.');
  if (!url.pathname.endsWith('/')) url.pathname += '/';

  async function post(path: string, body: unknown, signal: AbortSignal): Promise<unknown> {
    let response: Response;
    try { response = await request(new URL(path, url).href, { method: 'POST', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal }); }
    catch (error) { if (signal.aborted) throw error; throw new RouteError('network', 'Unable to reach the route service.'); }
    if (response.status === 429) throw new RouteError('quota', 'The route service is temporarily at its limit.');
    if (response.status === 404 || response.status === 422) throw new RouteError('unavailable', 'No driving route is available for those locations.');
    if (!response.ok) throw new RouteError('provider', 'The route service could not process this request.');
    try { return await response.json(); } catch { throw new RouteError('provider', 'The route service returned invalid data.'); }
  }

  return {
    async search(query, signal) {
      const clean = query.trim();
      if (clean.length < 3 || clean.length > 150) throw new RouteError('invalid-location', 'Enter at least three characters.');
      const result = await post('places', { query: clean, region: 'Melbourne', country: 'AU' }, signal);
      if (!Array.isArray(result) || result.length > 10 || !result.every((item) => validPlace(item as Place))) throw new RouteError('provider', 'The address service returned invalid suggestions.');
      return result as Place[];
    },
    async calculate(routeRequest, signal) {
      validateRouteRequest(routeRequest);
      const result = await post('routes', routeRequest, signal);
      if (!result || typeof result !== 'object') throw new RouteError('provider', 'The route service returned invalid data.');
      const route = result as Partial<DrivingRoute>;
      if (route.status !== 'success' || route.travelMode !== 'DRIVE' || route.simulated !== false || typeof route.routeId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(route.routeId) || typeof route.provider !== 'string' || !route.provider.trim() || !Number.isSafeInteger(route.distanceMetres) || (route.distanceMetres ?? 0) <= 0 || (route.distanceMetres ?? 0) > 10000000 || !Number.isSafeInteger(route.durationSeconds) || (route.durationSeconds ?? 0) <= 0 || (route.durationSeconds ?? 0) > 604800) throw new RouteError('provider', 'The route service returned an invalid driving route.');
      return route as DrivingRoute;
    },
    async quote(quoteRequest: QuoteRequest, signal) {
      if (!/^[A-Za-z0-9_-]{1,120}$/.test(quoteRequest.routeId) || (quoteRequest.returnRouteId !== null && !/^[A-Za-z0-9_-]{1,120}$/.test(quoteRequest.returnRouteId)) || !Array.isArray(quoteRequest.vehicleIds) || quoteRequest.vehicleIds.length === 0 || quoteRequest.vehicleIds.length > 20 || new Set(quoteRequest.vehicleIds).size !== quoteRequest.vehicleIds.length || !quoteRequest.vehicleIds.every((id) => /^[A-Za-z0-9_-]{1,120}$/.test(id)) || !['Airport Transfer', 'Point-to-Point', 'Return Journey'].includes(quoteRequest.journey) || (quoteRequest.serviceId !== '' && !/^[A-Za-z0-9_-]{1,120}$/.test(quoteRequest.serviceId)) || quoteRequest.timeZone !== 'Australia/Melbourne' || !/^\d{4}-\d{2}-\d{2}$/.test(quoteRequest.pickupDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quoteRequest.pickupTime) || (quoteRequest.journey === 'Return Journey' ? quoteRequest.returnRouteId === null || !/^\d{4}-\d{2}-\d{2}$/.test(quoteRequest.returnDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quoteRequest.returnTime) : quoteRequest.returnRouteId !== null) || !Number.isSafeInteger(quoteRequest.additionalStops) || quoteRequest.additionalStops < 0 || quoteRequest.additionalStops > 10 || !Number.isSafeInteger(quoteRequest.passengers) || quoteRequest.passengers < 1 || quoteRequest.passengers > 60 || !Number.isSafeInteger(quoteRequest.luggage) || quoteRequest.luggage < 0 || quoteRequest.luggage > 60 || (quoteRequest.waitingMinutes !== null && (!Number.isSafeInteger(quoteRequest.waitingMinutes) || quoteRequest.waitingMinutes < 0 || quoteRequest.waitingMinutes > 10080))) throw new RouteError('invalid-location', 'The quote request is incomplete.');
      const result = await post('quotes', quoteRequest, signal);
      if (!Array.isArray(result) || result.length > quoteRequest.vehicleIds.length) throw new RouteError('provider', 'The quote service returned invalid data.');
      const seen = new Set<string>();
      for (const item of result) {
        const quote = item as Partial<ServerQuote>;
        if (!item || typeof item !== 'object' || quote.status !== 'estimated' || quote.currency !== 'AUD' || quote.routeId !== quoteRequest.routeId || quote.returnRouteId !== quoteRequest.returnRouteId || typeof quote.vehicleId !== 'string' || !quoteRequest.vehicleIds.includes(quote.vehicleId) || seen.has(quote.vehicleId) || typeof quote.quoteId !== 'string' || !/^[A-Za-z0-9_-]{1,120}$/.test(quote.quoteId) || !Array.isArray(quote.lines) || quote.lines.length === 0 || quote.lines.length > 30 || !quote.lines.every((line) => line && typeof line.label === 'string' && line.label.length > 0 && line.label.length <= 100 && Number.isSafeInteger(line.cents) && line.cents >= 0) || !Number.isSafeInteger(quote.taxCents) || (quote.taxCents ?? -1) < 0 || !['none', 'inclusive', 'exclusive'].includes(quote.taxMode ?? '') || !Number.isSafeInteger(quote.totalCents) || (quote.totalCents ?? -1) < 0 || typeof quote.expiresAt !== 'string' || !Number.isFinite(Date.parse(quote.expiresAt)) || Date.parse(quote.expiresAt) <= Date.now()) throw new RouteError('provider', 'The quote service returned invalid data.');
        const subtotal = quote.lines.reduce((sum, line) => sum + line.cents, 0);
        const labels = quote.lines.map((line) => line.label);
        if (new Set(labels).size !== labels.length || !labels.includes('Base fare') || !labels.includes('Outbound distance') || (quoteRequest.returnRouteId !== null && !labels.includes('Return distance')) || !Number.isSafeInteger(subtotal) || (quote.taxMode === 'none' && quote.taxCents !== 0) || (quote.taxMode === 'inclusive' && quote.taxCents! > subtotal) || quote.totalCents !== subtotal + (quote.taxMode === 'exclusive' ? quote.taxCents! : 0)) throw new RouteError('provider', 'The quote breakdown is inconsistent.');
        seen.add(quote.vehicleId);
      }
      return result as ServerQuote[];
    },
  };
}