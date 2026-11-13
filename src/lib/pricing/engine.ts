import { Temporal } from '@js-temporal/polyfill';
import type { DrivingRoute } from '../routing/types';

export interface VehiclePricing {
  vehicleId: string;
  active: boolean;
  effectiveDate: string;
  baseFareCents: number;
  ratePerKilometreCents: number;
  minimumFareCents: number;
  waitingRatePerHourCents: number;
  additionalStopRateCents: number;
  airportSurchargeCents: number;
  afterHours: { disabled: true } | { disabled: false; start: string; end: string; surchargeCents: number; applies: 'per-leg' | 'per-journey' };
  gst: { mode: 'none' | 'inclusive' | 'exclusive'; basisPoints: number };
  returnBaseFare: 'once' | 'per-leg';
}

export interface PriceRequest {
  vehicleId: string;
  route: DrivingRoute | null;
  returnRoute: DrivingRoute | null;
  returnJourney: boolean;
  airportJourney: boolean;
  additionalStops: number;
  waitingMinutes: number | null;
  tollsCents: number | null;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export interface PriceLine { label: string; cents: number }
export type PricingResult = { status: 'quote-required'; reason: string } | { status: 'estimated'; vehicleId: string; lines: PriceLine[]; taxCents: number; taxMode: 'none' | 'inclusive' | 'exclusive'; totalCents: number; simulated: boolean };

const quote = (reason: string): PricingResult => ({ status: 'quote-required', reason });
const centsValid = (value: number) => Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
function validTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function validDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
function localInstant(date: string, time: string) { try { return Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime('Australia/Melbourne', { disambiguation: 'reject' }).toInstant(); } catch { return null; } }
function afterHours(time: string, start: string, end: string) { return start < end ? time >= start && time < end : time >= start || time < end; }
function validRoute(route: DrivingRoute | null): route is DrivingRoute { return !!route && route.status === 'success' && route.travelMode === 'DRIVE' && !!route.routeId && typeof route.simulated === 'boolean' && !!route.provider && Number.isSafeInteger(route.distanceMetres) && route.distanceMetres > 0 && route.distanceMetres <= 10000000 && Number.isSafeInteger(route.durationSeconds) && route.durationSeconds > 0; }
export function formatAud(cents: number) { if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError('Amount must be non-negative whole cents.'); return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100); }

export function calculateFare(request: PriceRequest, config?: VehiclePricing): PricingResult {
  if (!config || config.active !== true || config.vehicleId !== request.vehicleId || !request.vehicleId) return quote('No active vehicle pricing is configured.');
  if (!validDate(config.effectiveDate) || !validDate(request.pickupDate) || request.pickupDate < config.effectiveDate || (request.returnJourney && (!validDate(request.returnDate) || request.returnDate < request.pickupDate))) return quote('Pricing is not effective for this date.');
  if (![config.baseFareCents, config.ratePerKilometreCents, config.minimumFareCents, config.waitingRatePerHourCents, config.additionalStopRateCents, config.airportSurchargeCents].every(centsValid)) return quote('Pricing configuration is incomplete.');
  if (!validRoute(request.route) || (request.returnJourney && !validRoute(request.returnRoute))) return quote('A valid driving route is required for each journey leg.');
  if (typeof request.returnJourney !== 'boolean' || typeof request.airportJourney !== 'boolean') return quote('Journey details are invalid.');
  if (request.returnJourney && (request.returnRoute?.simulated !== request.route.simulated || request.returnRoute?.provider !== request.route.provider)) return quote('Route providers do not match.');
  if (!Number.isSafeInteger(request.additionalStops) || request.additionalStops < 0 || request.additionalStops > 25 || request.waitingMinutes === null || !Number.isSafeInteger(request.waitingMinutes) || request.waitingMinutes < 0 || request.waitingMinutes > 10080 || request.tollsCents === null || !centsValid(request.tollsCents)) return quote('Waiting time, stops or tolls are not confirmed.');
  if (!validTime(request.pickupTime) || (request.returnJourney && !validTime(request.returnTime))) return quote('Journey times are invalid.');
  const pickup = localInstant(request.pickupDate, request.pickupTime);
  const returning = request.returnJourney ? localInstant(request.returnDate, request.returnTime) : null;
  if (!pickup || (request.returnJourney && (!returning || Temporal.Instant.compare(returning, pickup) <= 0))) return quote('Melbourne journey times are invalid.');
  if (!config.gst || !['none', 'inclusive', 'exclusive'].includes(config.gst.mode) || !Number.isSafeInteger(config.gst.basisPoints) || config.gst.basisPoints < 0 || config.gst.basisPoints > 10000 || (config.gst.mode === 'none' && config.gst.basisPoints !== 0) || !['once', 'per-leg'].includes(config.returnBaseFare)) return quote('Tax or return pricing is not configured.');
  let afterHoursCount = 0;
  if (!config.afterHours || typeof config.afterHours.disabled !== 'boolean') return quote('After-hours rules are not configured.');
  if (!config.afterHours.disabled) {
    const policy = config.afterHours;
    if (!validTime(policy.start) || !validTime(policy.end) || policy.start === policy.end || !centsValid(policy.surchargeCents) || !['per-leg', 'per-journey'].includes(policy.applies)) return quote('After-hours rules are incomplete.');
    afterHoursCount = Number(afterHours(request.pickupTime, policy.start, policy.end)) + Number(request.returnJourney && afterHours(request.returnTime, policy.start, policy.end));
    if (policy.applies === 'per-journey') afterHoursCount = Math.min(1, afterHoursCount);
  }
  const returnMetres = request.returnJourney ? request.returnRoute!.distanceMetres : 0;
  const legs = request.returnJourney ? 2 : 1;
  const lines: PriceLine[] = [
    { label: 'Base fare', cents: config.baseFareCents * (config.returnBaseFare === 'per-leg' ? legs : 1) },
    { label: 'Outbound distance', cents: Math.round(config.ratePerKilometreCents * request.route.distanceMetres / 1000) },
  ];
  if (request.returnJourney) lines.push({ label: 'Return distance', cents: Math.round(config.ratePerKilometreCents * returnMetres / 1000) });
  lines.push({ label: 'Additional stops', cents: config.additionalStopRateCents * request.additionalStops }, { label: 'Waiting', cents: Math.round(config.waitingRatePerHourCents * request.waitingMinutes / 60) }, { label: 'Airport surcharge', cents: request.airportJourney ? config.airportSurchargeCents : 0 }, { label: 'After-hours surcharge', cents: config.afterHours.disabled ? 0 : config.afterHours.surchargeCents * afterHoursCount }, { label: 'Tolls', cents: request.tollsCents });
  const subtotal = lines.reduce((sum, line) => sum + line.cents, 0);
  if (!Number.isSafeInteger(subtotal) || !lines.every((line) => Number.isSafeInteger(line.cents))) return quote('Calculated amount is outside supported limits.');
  if (subtotal < config.minimumFareCents) lines.push({ label: 'Minimum fare adjustment', cents: config.minimumFareCents - subtotal });
  const beforeTax = Math.max(subtotal, config.minimumFareCents);
  const taxCents = config.gst.mode === 'exclusive' ? Math.round(beforeTax * config.gst.basisPoints / 10000) : config.gst.mode === 'inclusive' ? Math.round(beforeTax * config.gst.basisPoints / (10000 + config.gst.basisPoints)) : 0;
  const totalCents = beforeTax + (config.gst.mode === 'exclusive' ? taxCents : 0);
  if (!Number.isSafeInteger(totalCents)) return quote('Calculated amount is outside supported limits.');
  return { status: 'estimated', vehicleId: config.vehicleId, lines, taxCents, taxMode: config.gst.mode, totalCents, simulated: request.route.simulated };
}