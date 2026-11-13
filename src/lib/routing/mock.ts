import { RouteError, validateRouteRequest, type Place, type RouteProvider } from './types.ts';

const places: Place[] = [
  { provider: 'demo', placeId: 'demo-airport', formattedAddress: 'Demo location: airport precinct' },
  { provider: 'demo', placeId: 'demo-city', formattedAddress: 'Demo location: city centre' },
  { provider: 'demo', placeId: 'demo-waterfront', formattedAddress: 'Demo location: waterfront' },
  { provider: 'demo', placeId: 'demo-bayside', formattedAddress: 'Demo location: bayside' },
];

export function createMockRouteProvider(): RouteProvider {
  return {
    async search(query, signal) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      return places.filter((place) => place.formattedAddress.toLowerCase().includes(query.trim().toLowerCase()));
    },
    async calculate(request, signal) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      validateRouteRequest(request);
      if ([request.origin, ...request.stops, request.destination].some((place) => !places.some((sample) => sample.placeId === place.placeId && sample.provider === place.provider))) throw new RouteError('invalid-location', 'Choose demo locations from the suggestions.');
      return { status: 'success', routeId: 'demo-route', travelMode: 'DRIVE', provider: 'demonstration', simulated: true, distanceMetres: 24000 + request.stops.length * 3000, durationSeconds: 2100 + request.stops.length * 300 };
    },
  };
}