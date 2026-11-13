import { useEffect, useState } from 'react';
import { publishedVehicles } from '../../data/vehicles';
import { publishedServices } from '../../data/services';
import { destinations } from '../../data/destinations';

type Journey = {
  journey: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: string;
  luggage: string;
  vehicleId?: string;
  serviceId?: string;
  areaId?: string;
  flight?: string;
  duration?: string;
  stops?: string;
};

export default function BookingSummary() {
  const [journey, setJourney] = useState<Journey | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('karlook-journey');
      if (saved) setJourney(JSON.parse(saved) as Journey);
    } catch {
      setJourney(null);
    }
  }, []);

  if (!journey) return null;
  return (
    <div className="booking-summary">
      <h2>Your journey details</h2>
      <p>
        Saved in this browser for this session only. These details have not been
        sent and are not a booking.
      </p>
      <dl>
        <div>
          <dt>Journey</dt>
          <dd>{journey.journey}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd>{journey.pickup}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{journey.destination}</dd>
        </div>
        <div>
          <dt>Pickup date</dt>
          <dd>{journey.date.split('-').reverse().join('/')}</dd>
        </div>
        <div>
          <dt>Pickup time</dt>
          <dd>{journey.time}</dd>
        </div>
        <div>
          <dt>Passengers</dt>
          <dd>{journey.passengers}</dd>
        </div>
        <div>
          <dt>Luggage</dt>
          <dd>{journey.luggage}</dd>
        </div>
        {journey.vehicleId && (
          <div>
            <dt>Vehicle preference</dt>
            <dd>
              {publishedVehicles.find(
                (vehicle) => vehicle.id === journey.vehicleId,
              )?.name ?? 'Not available'}
            </dd>
          </div>
        )}
        {journey.serviceId && (
          <div>
            <dt>Service preference</dt>
            <dd>
              {publishedServices.find(
                (service) => service.slug === journey.serviceId,
              )?.title ?? 'Not available'}
            </dd>
          </div>
        )}
        {journey.areaId && (
          <div>
            <dt>Proposed area</dt>
            <dd>
              {destinations.find((area) => area.slug === journey.areaId)
                ?.name ?? 'Not available'}
            </dd>
          </div>
        )}
        {journey.flight && (
          <div>
            <dt>Flight number</dt>
            <dd>{journey.flight}</dd>
          </div>
        )}
        {journey.duration && (
          <div>
            <dt>Estimated duration</dt>
            <dd>{journey.duration} hours</dd>
          </div>
        )}
        {journey.stops && (
          <div>
            <dt>Additional stops</dt>
            <dd>{journey.stops}</dd>
          </div>
        )}
      </dl>
      <button
        type="button"
        onClick={() => {
          sessionStorage.removeItem('karlook-journey');
          setJourney(null);
          window.dispatchEvent(new Event('karlook-journey-clear'));
        }}
      >
        Clear journey details
      </button>
    </div>
  );
}
