import test from 'node:test';
import assert from 'node:assert/strict';
import { metresToKilometres } from '../src/lib/routing/types.ts';
import { calculateFare, formatAud } from '../src/lib/pricing/engine.ts';

const route = { status: 'success', routeId: 'test-route', travelMode: 'DRIVE', provider: 'test', simulated: true, distanceMetres: 15000, durationSeconds: 1800 };
const config = { vehicleId: 'test', active: true, effectiveDate: '2026-01-01', baseFareCents: 1000, ratePerKilometreCents: 200, minimumFareCents: 0, waitingRatePerHourCents: 1200, additionalStopRateCents: 300, airportSurchargeCents: 500, afterHours: { disabled: false, start: '22:00', end: '06:00', surchargeCents: 700, applies: 'per-leg' }, gst: { mode: 'none', basisPoints: 0 }, returnBaseFare: 'per-leg' };
const request = { vehicleId: 'test', route, returnRoute: null, returnJourney: false, airportJourney: true, additionalStops: 2, waitingMinutes: 30, tollsCents: 400, pickupDate: '2030-01-01', pickupTime: '23:00', returnDate: '', returnTime: '' };

test('converts metres to kilometres and formats AUD', () => {
  assert.equal(metresToKilometres(12345), 12.345);
  assert.throws(() => metresToKilometres(-1));
  assert.equal(formatAud(12345), '$123.45');
});

test('calculates distance, stops, waiting, airport and after-hours charges once', () => {
  const result = calculateFare(request, config);
  assert.equal(result.status, 'estimated');
  assert.equal(result.totalCents, 6800);
  assert.equal(result.lines.find((line) => line.label === 'Airport surcharge').cents, 500);
  assert.equal(result.lines.find((line) => line.label === 'Waiting').cents, 600);
});

test('prices a return from both actual legs and applies minimum and GST explicitly', () => {
  const returned = calculateFare({ ...request, returnJourney: true, returnRoute: { ...route, distanceMetres: 12000 }, returnDate: '2030-01-02', returnTime: '23:30' }, config);
  assert.equal(returned.totalCents, 10900);
  const exclusive = calculateFare(request, { ...config, minimumFareCents: 10000, gst: { mode: 'exclusive', basisPoints: 1000 } });
  assert.equal(exclusive.totalCents, 11000);
  assert.equal(exclusive.taxCents, 1000);
  assert.equal(exclusive.lines.find((line) => line.label === 'Minimum fare adjustment').cents, 3200);
  const inclusive = calculateFare(request, { ...config, minimumFareCents: 10000, gst: { mode: 'inclusive', basisPoints: 1000 } });
  assert.equal(inclusive.totalCents, 10000);
  assert.equal(inclusive.taxCents, 909);
});

test('requires a quote for missing rates, unknown costs, inactive pricing and invalid routes', () => {
  for (const [input, rates] of [[request, undefined], [request, { ...config, ratePerKilometreCents: undefined }], [request, { ...config, active: false }], [{ ...request, vehicleId: 'other' }, config], [{ ...request, tollsCents: null }, config], [{ ...request, waitingMinutes: null }, config], [{ ...request, route: { ...route, distanceMetres: -1 } }, config], [{ ...request, returnJourney: true }, config], [request, { ...config, gst: undefined }]]) {
    assert.equal(calculateFare(input, rates).status, 'quote-required');
  }
});