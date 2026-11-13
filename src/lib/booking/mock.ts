import type { BookingAdapter } from './adapters';

export function createMockAdapter(fail = false): BookingAdapter {
  return {
    async submit(payload) {
      if (fail)
        throw new Error('Simulated submission failure. No enquiry was sent.');
      return {
        status: 'simulated',
        reference: `TEST-${payload.clientRequestId}`,
      };
    },
  };
}
