export type JourneyType =
  'Airport Transfer' | 'Point-to-Point' | 'Return Journey' | 'Hourly Chauffeur';

export interface BookingDraft {
  journey: JourneyType;
  timeZone: 'Australia/Melbourne';
  serviceId: string;
  areaId: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  returnDate: string;
  returnTime: string;
  passengers: string;
  luggage: string;
  stops: string;
  duration: string;
  waitingMinutes: string;
  flight: string;
  vehicleId: string;
  childSeats: string;
  pickupInstructions: string;
  accessibilityRequirements: string;
  specialRequests: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: '+61';
  mobile: string;
  notes: string;
  privacyAccepted: boolean;
}

export type EnquiryStatus =
  'draft' | 'submitting' | 'received' | 'simulated' | 'error';
export interface EnquiryPayload {
  clientRequestId: string;
  createdAt: string;
  booking: BookingDraft;
  routeReference?: { routeId: string; returnRouteId: string | null; quoteId?: string };
}
export interface EnquiryReceipt {
  status: 'received' | 'simulated';
  reference: string;
}

export const emptyBooking: BookingDraft = {
  journey: 'Point-to-Point',
  timeZone: 'Australia/Melbourne',
  serviceId: '',
  areaId: '',
  pickup: '',
  destination: '',
  date: '',
  time: '',
  returnDate: '',
  returnTime: '',
  passengers: '1',
  luggage: '0',
  stops: '',
  duration: '',
  waitingMinutes: '',
  flight: '',
  vehicleId: '',
  childSeats: '0',
  pickupInstructions: '',
  accessibilityRequirements: '',
  specialRequests: '',
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+61',
  mobile: '',
  notes: '',
  privacyAccepted: false,
};
