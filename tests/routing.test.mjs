import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackendRouteProvider } from '../src/lib/routing/backend.ts';
import { createMockRouteProvider } from '../src/lib/routing/mock.ts';

const origin = { provider: 'google-places', placeId: 'origin', formattedAddress: 'Origin' };
const destination = { provider: 'google-places', placeId: 'destination', formattedAddress: 'Destination' };
const request = { origin, destination, stops: [], travelMode: 'DRIVE' };
const signal = new globalThis.AbortController().signal;

test('requires provider-selected places and returns explicitly simulated mock routes', async () => {
  const provider = createMockRouteProvider();
  const matches = await provider.search('demo', signal);
  const route = await provider.calculate({ origin: matches[0], destination: matches[1], stops: [matches[2]], travelMode: 'DRIVE' }, signal);
  assert.equal(route.simulated, true);
  assert.equal(route.distanceMetres, 27000);
  await assert.rejects(() => provider.calculate({ ...request, origin: { ...origin, placeId: '' } }, signal), { code: 'invalid-location' });
});

test('maps quota, route and network failures without inventing results', async () => {
  const quota = createBackendRouteProvider('https://example.com/api/', async () => new globalThis.Response('{}', { status: 429 }));
  await assert.rejects(() => quota.search('Melbourne', signal), { code: 'quota' });
  const unavailable = createBackendRouteProvider('https://example.com/api/', async () => new globalThis.Response('{}', { status: 422 }));
  await assert.rejects(() => unavailable.calculate(request, signal), { code: 'unavailable' });
  const network = createBackendRouteProvider('https://example.com/api/', async () => { throw new TypeError('network'); });
  await assert.rejects(() => network.calculate(request, signal), { code: 'network' });
  assert.throws(() => createBackendRouteProvider('http://example.com/api/'));
});

test('rejects invalid routes and quotes that do not match the requested vehicle or breakdown', async () => {
  const invalid = createBackendRouteProvider('https://example.com/api/', async () => new globalThis.Response(JSON.stringify({ status: 'success', travelMode: 'WALK', routeId: 'x', provider: 'test', simulated: false, distanceMetres: 1000, durationSeconds: 100 })));
  await assert.rejects(() => invalid.calculate(request, signal), { code: 'provider' });
  const quoteRequest = { routeId: 'route', returnRouteId: null, vehicleIds: ['vehicle'], journey: 'Point-to-Point', serviceId: '', timeZone: 'Australia/Melbourne', pickupDate: '2030-01-01', pickupTime: '10:00', returnDate: '', returnTime: '', additionalStops: 0, passengers: 1, luggage: 0, waitingMinutes: null };
  const badQuote = createBackendRouteProvider('https://example.com/api/', async () => new globalThis.Response(JSON.stringify([{ status: 'estimated', currency: 'AUD', routeId: 'route', returnRouteId: null, vehicleId: 'vehicle', quoteId: 'quote', lines: [{ label: 'Base', cents: 1000 }], taxCents: 0, taxMode: 'none', totalCents: 1, expiresAt: '2099-01-01T00:00:00Z' }])));
  await assert.rejects(() => badQuote.quote(quoteRequest, signal), { code: 'provider' });
});