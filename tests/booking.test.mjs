import test from 'node:test';
import assert from 'node:assert/strict';
import { Temporal } from '@js-temporal/polyfill';
import { emptyBooking } from '../src/lib/booking/model.ts';
import {
  eligibleVehicles,
  validateBookingStep,
} from '../src/lib/booking/validation.ts';
import { createApiAdapter } from '../src/lib/booking/adapters.ts';
import { createMockAdapter } from '../src/lib/booking/mock.ts';

const now = Temporal.Instant.from('2026-11-14T00:00:00Z');
const booking = {
  ...emptyBooking,
  pickup: 'Melbourne Airport',
  destination: 'Southbank',
  date: '2030-12-01',
  time: '10:30',
  firstName: 'Alex',
  lastName: 'Example',
  email: 'alex@example.com',
  mobile: '0412345678',
  privacyAccepted: true,
};

test('validates Melbourne pickup, return order and daylight-saving transitions', () => {
  assert.deepEqual(validateBookingStep(1, booking, [], now), {});
  assert.ok(
    validateBookingStep(1, { ...booking, date: '2020-01-01' }, [], now).date,
  );
  assert.ok(
    validateBookingStep(
      1,
      { ...booking, date: '2027-10-03', time: '02:30' },
      [],
      now,
    ).date,
  );
  assert.ok(
    validateBookingStep(
      1,
      {
        ...booking,
        journey: 'Return Journey',
        returnDate: '2030-12-01',
        returnTime: '09:00',
      },
      [],
      now,
    ).returnDate,
  );
  assert.ok(
    validateBookingStep(
      1,
      { ...booking, journey: 'Hourly Chauffeur', duration: '' },
      [],
      now,
    ).duration,
  );
});

test('validates customer contact, consent and verified vehicle capacity', () => {
  assert.deepEqual(validateBookingStep(4, booking, [], now), {});
  assert.ok(
    validateBookingStep(
      4,
      { ...booking, mobile: '0399999999', privacyAccepted: false },
      [],
      now,
    ).mobile,
  );
  assert.ok(
    validateBookingStep(4, { ...booking, privacyAccepted: false }, [], now)
      .privacyAccepted,
  );
  const vehicles = [
    {
      id: 'sample',
      passengers: 9,
      luggage: 9,
      published: true,
      demonstration: true,
    },
    {
      id: 'small',
      passengers: 2,
      luggage: 1,
      published: true,
      demonstration: false,
      capacityVerified: true,
    },
    {
      id: 'unverified',
      passengers: 2,
      luggage: 1,
      published: true,
      demonstration: false,
    },
  ];
  assert.deepEqual(
    eligibleVehicles(vehicles, '3', '2').map((vehicle) => vehicle.id),
    ['unverified'],
  );
  assert.ok(
    validateBookingStep(2, { ...booking, vehicleId: 'sample' }, vehicles, now)
      .vehicleId,
  );
});

test('only accepts explicit backend receipt and marks the mock as simulated', async () => {
  const payload = {
    clientRequestId: 'test-id',
    createdAt: '2026-11-14T00:00:00Z',
    booking,
  };
  assert.throws(() => createApiAdapter('http://127.0.0.1:4309/enquiries'));
  assert.throws(() => createApiAdapter('https://user:secret@example.com/api'));
  let idempotencyKey;
  let transport;
  const api = createApiAdapter(
    'https://example.com/api',
    async (_url, init) => {
      idempotencyKey = init.headers['Idempotency-Key'];
      transport = {
        credentials: init.credentials,
        redirect: init.redirect,
        referrerPolicy: init.referrerPolicy,
      };
      return new globalThis.Response(
        JSON.stringify({ status: 'received', reference: 'ENQ-123' }),
        { status: 201 },
      );
    },
  );
  assert.deepEqual(
    await api.submit(payload, new globalThis.AbortController().signal),
    { status: 'received', reference: 'ENQ-123' },
  );
  assert.equal(idempotencyKey, 'test-id');
  assert.deepEqual(transport, {
    credentials: 'omit',
    redirect: 'error',
    referrerPolicy: 'no-referrer',
  });
  const failure = createApiAdapter(
    'https://example.com/api',
    async () => new globalThis.Response('{}', { status: 500 }),
  );
  await assert.rejects(() =>
    failure.submit(payload, new globalThis.AbortController().signal),
  );
  const ambiguous = createApiAdapter(
    'https://example.com/api',
    async () => new globalThis.Response('{}', { status: 200 }),
  );
  await assert.rejects(() =>
    ambiguous.submit(payload, new globalThis.AbortController().signal),
  );
  assert.equal(
    (
      await createMockAdapter().submit(
        payload,
        new globalThis.AbortController().signal,
      )
    ).status,
    'simulated',
  );
  await assert.rejects(() =>
    createMockAdapter(true).submit(
      payload,
      new globalThis.AbortController().signal,
    ),
  );
});
