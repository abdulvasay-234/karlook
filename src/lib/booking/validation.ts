import { Temporal } from '@js-temporal/polyfill';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { BookingDraft } from './model';

export type BookingErrors = Partial<Record<keyof BookingDraft, string>>;
export interface SelectableVehicle {
  id: string;
  passengers: number;
  luggage: number;
  demonstration: boolean;
  published: boolean;
  capacityVerified?: boolean;
}

function melbourneInstant(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return null;
  try {
    return Temporal.PlainDateTime.from(`${date}T${time}`)
      .toZonedDateTime('Australia/Melbourne', { disambiguation: 'reject' })
      .toInstant();
  } catch {
    return null;
  }
}

function wholeNumber(value: string, minimum: number, maximum: number) {
  return (
    /^\d+$/.test(value) && Number(value) >= minimum && Number(value) <= maximum
  );
}

export function australianMobile(value: string) {
  const phone = parsePhoneNumberFromString(value.trim(), 'AU');
  return phone?.isValid() &&
    phone.country === 'AU' &&
    phone.getType() === 'MOBILE'
    ? phone
    : undefined;
}

export function eligibleVehicles(
  vehicles: SelectableVehicle[],
  passengers: string,
  luggage: string,
) {
  return vehicles.filter(
    (vehicle) =>
      vehicle.published &&
      !vehicle.demonstration &&
      (!vehicle.capacityVerified ||
        (vehicle.passengers >= Number(passengers) &&
          vehicle.luggage >= Number(luggage))),
  );
}

export function validateBookingStep(
  step: number,
  booking: BookingDraft,
  vehicles: SelectableVehicle[],
  now = Temporal.Now.instant(),
): BookingErrors {
  const errors: BookingErrors = {};
  if (
    step === 0 &&
    ![
      'Airport Transfer',
      'Point-to-Point',
      'Return Journey',
      'Hourly Chauffeur',
    ].includes(booking.journey)
  )
    errors.journey = 'Choose a journey type.';
  if (step === 1) {
    if (booking.timeZone !== 'Australia/Melbourne')
      errors.date = 'The journey time zone must be Melbourne.';
    if (!booking.pickup.trim() || booking.pickup.trim().length > 300)
      errors.pickup = 'Enter a pickup location (up to 300 characters).';
    if (!booking.destination.trim() || booking.destination.trim().length > 300)
      errors.destination = 'Enter a destination (up to 300 characters).';
    const pickup = melbourneInstant(booking.date, booking.time);
    if (!pickup)
      errors.date =
        'Enter a valid Melbourne pickup date and time, avoiding daylight-saving clock changes.';
    else if (Temporal.Instant.compare(pickup, now) <= 0)
      errors.date = 'Choose a future pickup date and time.';
    if (booking.journey === 'Return Journey') {
      const returnTime = melbourneInstant(
        booking.returnDate,
        booking.returnTime,
      );
      if (!returnTime)
        errors.returnDate = 'Enter a valid Melbourne return date and time.';
      else if (pickup && Temporal.Instant.compare(returnTime, pickup) <= 0)
        errors.returnDate = 'Return must be after the pickup.';
    }
    if (!wholeNumber(booking.passengers, 1, 60))
      errors.passengers = 'Enter between 1 and 60 passengers.';
    if (!wholeNumber(booking.luggage, 0, 60))
      errors.luggage = 'Enter between 0 and 60 bags.';
    if (
      booking.journey === 'Hourly Chauffeur' &&
      !wholeNumber(booking.duration, 1, 720)
    )
      errors.duration = 'Enter an estimated duration from 1 to 720 hours.';
    if (booking.stops.length > 3100)
      errors.stops = 'Use 3100 characters or fewer.';
    if (booking.flight.length > 30)
      errors.flight = 'Use 30 characters or fewer.';
  }
  if (
    step === 2 &&
    booking.vehicleId &&
    !eligibleVehicles(vehicles, booking.passengers, booking.luggage).some(
      (vehicle) => vehicle.id === booking.vehicleId,
    )
  )
    errors.vehicleId =
      'Select an eligible configured vehicle or no preference.';
  if (step === 3) {
    if (booking.waitingMinutes && !wholeNumber(booking.waitingMinutes, 0, 10080)) errors.waitingMinutes = 'Enter between 0 and 10080 minutes.';
    if (
      !wholeNumber(booking.childSeats, 0, 60) ||
      Number(booking.childSeats) > Number(booking.passengers)
    )
      errors.childSeats = 'Child seats cannot exceed the number of passengers.';
    for (const field of [
      'stops',
      'flight',
      'pickupInstructions',
      'accessibilityRequirements',
      'specialRequests',
    ] as const) {
      if (booking[field].length > (field === 'flight' ? 30 : field === 'stops' ? 3100 : 500))
        errors[field] = 'This entry is too long.';
    }
  }
  if (step === 4) {
    if (!booking.firstName.trim() || booking.firstName.trim().length > 80)
      errors.firstName = 'Enter your first name.';
    if (!booking.lastName.trim() || booking.lastName.trim().length > 80)
      errors.lastName = 'Enter your last name.';
    if (
      booking.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email.trim())
    )
      errors.email = 'Enter a valid email address.';
    if (booking.countryCode !== '+61' || !australianMobile(booking.mobile))
      errors.mobile = 'Enter a valid Australian mobile number.';
    if (booking.notes.length > 500)
      errors.notes = 'Use 500 characters or fewer.';
    if (!booking.privacyAccepted)
      errors.privacyAccepted = 'Please acknowledge the privacy notice.';
  }
  return errors;
}

export function validateBooking(
  booking: BookingDraft,
  vehicles: SelectableVehicle[],
  now = Temporal.Now.instant(),
) {
  return Array.from({ length: 5 }, (_, step) =>
    validateBookingStep(step, booking, vehicles, now),
  );
}
