import { useEffect, useRef, useState } from 'react';
import { createBackendRouteProvider } from '../../lib/routing/backend';
import { RouteError, type DrivingRoute, type Place, type QuoteProvider, type RouteProvider, type ServerQuote } from '../../lib/routing/types';
import type { BookingDraft } from '../../lib/booking/model';
import { eligibleVehicles, validateBookingStep, type SelectableVehicle } from '../../lib/booking/validation';

type Provider = RouteProvider & Partial<QuoteProvider>;
type StopInput = { value: string; place: Place | null };
type RouteState = { key: string; status: 'loading' | 'success' | 'error'; outbound?: DrivingRoute; inbound?: DrivingRoute; message?: string };
type QuoteState = { key: string; status: 'loading' | 'success' | 'error'; quotes: ServerQuote[]; message?: string };

export function useRouteEstimate(draft: BookingDraft, vehicles: SelectableVehicle[], onStopsChange: (value: string) => void) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerError, setProviderError] = useState('');
  const [origin, setOrigin] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [stops, setStops] = useState<StopInput[]>(draft.stops ? [{ value: draft.stops, place: null }] : []);
  const [routeState, setRouteState] = useState<RouteState | null>(null);
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const apiUrl = import.meta.env.PUBLIC_ROUTE_API_URL?.trim() || '';
  const demo = !apiUrl && import.meta.env.PUBLIC_ROUTE_DEMO === 'true';
  const enabled = !!apiUrl || demo;

  useEffect(() => {
    let active = true;
    async function configure() {
      try {
        if (apiUrl) setProvider(createBackendRouteProvider(apiUrl, fetch, import.meta.env.DEV));
        else if (import.meta.env.PUBLIC_ROUTE_DEMO === 'true') {
          const { createMockRouteProvider } = await import('../../lib/routing/mock');
          if (active) setProvider(createMockRouteProvider());
        }
      } catch { if (active) setProviderError('Route service configuration is unavailable. You can still request a custom quote.'); }
    }
    void configure();
    return () => { active = false; };
  }, []);

  const stopsText = stops.map((stop) => stop.value.trim()).filter(Boolean).join(' | ');
  useEffect(() => {
    if (stopsText !== draft.stops) setStops(draft.stops ? [{ value: draft.stops, place: null }] : []);
  }, [draft.stops]);

  const key = JSON.stringify([origin, destination, stops, draft.pickup, draft.destination, draft.stops, draft.journey === 'Return Journey']);
  const ready = !!provider && !!origin && !!destination && origin.formattedAddress === draft.pickup && destination.formattedAddress === draft.destination && stopsText === draft.stops && stops.every((stop) => stop.place && stop.place.formattedAddress === stop.value);
  const currentRoute = routeState?.key === key ? routeState : null;

  useEffect(() => {
    const version = ++generation.current;
    if (!ready || !provider || !origin || !destination) return;
    const controller = new AbortController();
    let timedOut = false;
    setRouteState({ key, status: 'loading' });
    const timer = window.setTimeout(async () => {
      const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
      try {
        const selectedStops = stops.map((stop) => stop.place!);
        const outbound = await provider.calculate({ origin, destination, stops: selectedStops, travelMode: 'DRIVE' }, controller.signal);
        const inbound = draft.journey === 'Return Journey' ? await provider.calculate({ origin: destination, destination: origin, stops: [...selectedStops].reverse(), travelMode: 'DRIVE' }, controller.signal) : undefined;
        if (inbound && (inbound.simulated !== outbound.simulated || inbound.provider !== outbound.provider)) throw new RouteError('provider', 'The return route could not be verified.');
        if (!controller.signal.aborted && generation.current === version) setRouteState({ key, status: 'success', outbound, inbound });
      } catch (error) {
        if (generation.current === version && (!controller.signal.aborted || timedOut)) setRouteState({ key, status: 'error', message: timedOut ? 'The route service did not respond. Please try again.' : error instanceof RouteError ? error.message : 'The route could not be calculated.' });
      } finally { window.clearTimeout(timeout); }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [key, provider, ready, retry]);

  const ids = eligibleVehicles(vehicles, draft.passengers, draft.luggage).map((vehicle) => vehicle.id).sort().join('|');
  const quoteKey = JSON.stringify([key, currentRoute?.outbound?.routeId, currentRoute?.inbound?.routeId, ids, draft.serviceId, draft.date, draft.time, draft.returnDate, draft.returnTime, draft.passengers, draft.luggage, draft.waitingMinutes]);
  const currentQuote = currentRoute?.status === 'success' && quoteState?.key === quoteKey ? quoteState : null;
  const detailsValid = Object.keys(validateBookingStep(1, draft, vehicles)).length === 0 && Object.keys(validateBookingStep(3, draft, vehicles)).length === 0;
  useEffect(() => {
    if (!provider?.quote || !currentRoute?.outbound || currentRoute.status !== 'success' || currentRoute.outbound.simulated || !ids || !detailsValid || draft.journey === 'Hourly Chauffeur') return;
    const controller = new AbortController();
    let timedOut = false;
    setQuoteState({ key: quoteKey, status: 'loading', quotes: [] });
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
    void provider.quote({ routeId: currentRoute.outbound.routeId, returnRouteId: currentRoute.inbound?.routeId ?? null, vehicleIds: ids.split('|'), journey: draft.journey, serviceId: draft.serviceId, timeZone: 'Australia/Melbourne', pickupDate: draft.date, pickupTime: draft.time, returnDate: draft.journey === 'Return Journey' ? draft.returnDate : '', returnTime: draft.journey === 'Return Journey' ? draft.returnTime : '', additionalStops: stops.length, passengers: Number(draft.passengers), luggage: Number(draft.luggage), waitingMinutes: draft.waitingMinutes === '' ? null : Number(draft.waitingMinutes) }, controller.signal).then((quotes) => {
      if (!controller.signal.aborted) setQuoteState({ key: quoteKey, status: 'success', quotes });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted || timedOut) setQuoteState({ key: quoteKey, status: 'error', quotes: [], message: timedOut ? 'The quote service did not respond.' : error instanceof RouteError ? error.message : 'The quote service is unavailable.' });
    }).finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [quoteKey, provider, currentRoute, ids, detailsValid]);

  useEffect(() => {
    if (!currentQuote?.quotes.length) return;
    const expiry = Math.min(...currentQuote.quotes.map((quote) => Date.parse(quote.expiresAt)));
    const timer = window.setTimeout(() => setQuoteState(null), Math.min(Math.max(0, expiry - Date.now()), 2147483647));
    return () => window.clearTimeout(timer);
  }, [currentQuote]);

  function changeStop(index: number, value: string, place: Place | null) {
    const next = stops.map((stop, current) => current === index ? { value, place } : stop);
    setStops(next);
    onStopsChange(next.map((stop) => stop.value.trim()).filter(Boolean).join(' | '));
  }
  function removeStop(index: number) {
    const next = stops.filter((_, current) => current !== index);
    setStops(next);
    onStopsChange(next.map((stop) => stop.value.trim()).filter(Boolean).join(' | '));
  }
  function clear() { generation.current++; setOrigin(null); setDestination(null); setStops([]); setRouteState(null); setQuoteState(null); }

  return { enabled, demo, provider, providerError, origin, setOrigin, destination, setDestination, stops, addStop: () => setStops((current) => current.length < 10 ? [...current, { value: '', place: null }] : current), changeStop, removeStop, route: currentRoute, quotes: currentQuote?.quotes.filter((quote) => Date.parse(quote.expiresAt) > Date.now()) ?? [], quoteStatus: currentQuote?.status, quoteError: currentQuote?.message, retry: () => setRetry((current) => current + 1), clear };
}