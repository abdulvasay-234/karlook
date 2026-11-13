export interface Place {
  provider: string;
  placeId: string;
  formattedAddress: string;
}

export interface RouteRequest {
  origin: Place;
  destination: Place;
  stops: Place[];
  travelMode: 'DRIVE';
}

export interface DrivingRoute {
  status: 'success';
  routeId: string;
  travelMode: 'DRIVE';
  provider: string;
  simulated: boolean;
  distanceMetres: number;
  durationSeconds: number;
}

export type RouteErrorCode = 'invalid-location' | 'unavailable' | 'quota' | 'network' | 'provider';
export class RouteError extends Error {
  code: RouteErrorCode;
  constructor(code: RouteErrorCode, message: string) { super(message); this.name = 'RouteError'; this.code = code; }
}

export function validPlace(value: Place | null): value is Place {
  return !!value && typeof value.provider === 'string' && value.provider.trim().length > 0 && value.provider.length <= 80 && typeof value.placeId === 'string' && value.placeId.trim().length > 0 && value.placeId.length <= 300 && typeof value.formattedAddress === 'string' && value.formattedAddress.trim().length > 0 && value.formattedAddress.length <= 300;
}

export function validateRouteRequest(request: RouteRequest) {
  if (request.travelMode !== 'DRIVE' || !validPlace(request.origin) || !validPlace(request.destination) || !Array.isArray(request.stops) || request.stops.length > 10 || !request.stops.every(validPlace)) throw new RouteError('invalid-location', 'Select valid locations before calculating a route.');
  if (request.origin.provider !== request.destination.provider || request.stops.some((stop) => stop.provider !== request.origin.provider)) throw new RouteError('invalid-location', 'Select locations from the same provider.');
}

export interface RouteProvider {
  search(query: string, signal: AbortSignal): Promise<Place[]>;
  calculate(request: RouteRequest, signal: AbortSignal): Promise<DrivingRoute>;
}

export interface QuoteRequest {
  routeId: string;
  returnRouteId: string | null;
  vehicleIds: string[];
  journey: string;
  serviceId: string;
  timeZone: 'Australia/Melbourne';
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  additionalStops: number;
  passengers: number;
  luggage: number;
  waitingMinutes: number | null;
}
export interface ServerQuote {
  status: 'estimated';
  quoteId: string;
  routeId: string;
  returnRouteId: string | null;
  vehicleId: string;
  currency: 'AUD';
  lines: { label: string; cents: number }[];
  taxCents: number;
  taxMode: 'none' | 'inclusive' | 'exclusive';
  totalCents: number;
  expiresAt: string;
}
export interface QuoteProvider { quote(request: QuoteRequest, signal: AbortSignal): Promise<ServerQuote[]> }

export function metresToKilometres(metres: number) {
  if (!Number.isFinite(metres) || metres < 0) throw new RangeError('Distance must be a non-negative number of metres.');
  return metres / 1000;
}