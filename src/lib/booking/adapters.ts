import type { EnquiryPayload, EnquiryReceipt } from './model';

export interface BookingAdapter {
  submit(payload: EnquiryPayload, signal: AbortSignal): Promise<EnquiryReceipt>;
}

export function createApiAdapter(
  apiUrl: string,
  request: typeof fetch = fetch,
  allowInsecureLocal = false,
): BookingAdapter {
  const url = new URL(apiUrl);
  if (url.username || url.password)
    throw new Error('Booking API URL must not contain credentials.');
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      allowInsecureLocal &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
  )
    throw new Error('Booking API must use HTTPS.');
  return {
    async submit(payload, signal) {
      const response = await request(url.href, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': payload.clientRequestId,
        },
        body: JSON.stringify(payload),
        signal,
      });
      if (!response.ok)
        throw new Error(
          'The server could not confirm receipt. Retry with the same details or contact support.',
        );
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error(
          'The server did not confirm receipt. Please contact support before retrying.',
        );
      }
      if (
        !result ||
        typeof result !== 'object' ||
        !('status' in result) ||
        result.status !== 'received' ||
        !('reference' in result) ||
        typeof result.reference !== 'string' ||
        !/^[A-Za-z0-9_-]{1,80}$/.test(result.reference)
      )
        throw new Error(
          'The server did not confirm receipt. Please contact support before retrying.',
        );
      return { status: 'received', reference: result.reference };
    },
  };
}
