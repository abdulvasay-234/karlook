import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { publishedVehicles } from '../../data/vehicles';
import { publishedServices } from '../../data/services';
import { destinations } from '../../data/destinations';
import type { BookingDraft, JourneyType } from '../../lib/booking/model';

const BookingApp = lazy(async () => {
  await import('../../styles/booking.css');
  return import('./BookingApp');
});

function BookingTakeover({
  draft,
  onExit,
  onComplete,
}: {
  draft: Partial<BookingDraft>;
  onExit: () => void;
  onComplete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      className="booking-takeover"
      aria-label="Booking enquiry"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onExit();
      }}
    >
      <Suspense
        fallback={
          <div className="booking-app-loading" role="status">
            Preparing your journey...
          </div>
        }
      >
        <BookingApp
          initialDraft={draft}
          embedded
          onExit={onExit}
          onComplete={onComplete}
          onBusyChange={setBusy}
        />
      </Suspense>
    </dialog>,
    document.body,
  );
}

const journeyTypes = [
  'Airport Transfer',
  'Point-to-Point',
  'Return Journey',
  'Hourly Chauffeur',
];
const emptyDetails = {
  pickup: '',
  destination: '',
  date: '',
  time: '',
  passengers: '1',
  luggage: '0',
  flight: '',
  duration: '',
  stops: '',
};

export default function BookingWidget({
  bookingHref,
}: {
  bookingHref: string;
}) {
  const [journey, setJourney] = useState(journeyTypes[0]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [details, setDetails] = useState(emptyDetails);
  const [handoff, setHandoff] = useState<Partial<BookingDraft> | null>(null);
  const returnUrl = useRef('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const requested = query.get('vehicle');
    const requestedService = publishedServices.find(
      (service) => service.slug === query.get('service'),
    );
    const requestedArea = destinations.find(
      (destination) => destination.slug === query.get('destination'),
    );
    try {
      sessionStorage.removeItem('karlook-journey');
    } catch {
      setVehicleId('');
    }
    if (publishedVehicles.some((vehicle) => vehicle.id === requested))
      setVehicleId(requested ?? '');
    if (requestedService) {
      setServiceId(requestedService.slug);
      setJourney(requestedService.journeyType);
    }
    if (requestedArea) {
      setAreaId(requestedArea.slug);
      if (!requestedService) {
        if (requestedArea.slug === 'melbourne-airport') {
          setJourney('Airport Transfer');
          setServiceId('airport-transfers');
        } else {
          setJourney('Point-to-Point');
        }
      }
    }
    setReady(true);
    function clearJourney() {
      setDetails(emptyDetails);
      setJourney(journeyTypes[0]);
      setVehicleId('');
      setServiceId('');
      setAreaId('');
    }
    window.addEventListener('karlook-journey-clear', clearJourney);
    return () =>
      window.removeEventListener('karlook-journey-clear', clearJourney);
  }, []);

  useEffect(() => {
    if (!handoff) return;
    function onHistoryChange() {
      if (
        !window.location.pathname.startsWith(bookingHref.replace(/\/$/, ''))
      ) {
        setHandoff(null);
        setDetails(emptyDetails);
        setJourney(journeyTypes[0]);
        setVehicleId('');
        setServiceId('');
        setAreaId('');
        try {
          sessionStorage.removeItem('karlook-booking-progress');
          sessionStorage.removeItem('karlook-booking-request');
        } catch {
          setError('Unable to clear saved progress.');
        }
      }
    }
    window.addEventListener('popstate', onHistoryChange);
    return () => window.removeEventListener('popstate', onHistoryChange);
  }, [handoff, bookingHref]);

  function closeTakeover() {
    setHandoff(null);
    setDetails(emptyDetails);
    setJourney(journeyTypes[0]);
    setError('');
    setVehicleId('');
    setServiceId('');
    setAreaId('');
    try {
      sessionStorage.removeItem('karlook-booking-progress');
      sessionStorage.removeItem('karlook-booking-request');
    } catch {
      setError('Unable to clear saved progress.');
    }
    if (returnUrl.current)
      window.history.replaceState({}, '', returnUrl.current);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const pickup = String(data.get('pickup') || '').trim();
    const destination = String(data.get('destination') || '').trim();
    const date = String(data.get('date') || '');
    const time = String(data.get('time') || '');

    if (!pickup || !destination) {
      setError('Please enter a pickup location and destination.');
      return;
    }
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const part = (type: string) =>
      parts.find((item) => item.type === type)?.value ?? '';
    const melbourneNow = `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
    if (!date || !time || `${date}T${time}` <= melbourneNow) {
      setError('Please choose a future pickup date and time.');
      return;
    }
    const query = new URLSearchParams();
    if (vehicleId) query.set('vehicle', vehicleId);
    if (serviceId) query.set('service', serviceId);
    if (areaId) query.set('destination', areaId);
    returnUrl.current = window.location.href;
    setHandoff({
      journey: journey as JourneyType,
      pickup,
      destination,
      date,
      time,
      passengers: String(data.get('passengers')),
      luggage: String(data.get('luggage')),
      vehicleId,
      serviceId,
      areaId,
      flight: journey === 'Airport Transfer' ? details.flight.trim() : '',
      duration: journey === 'Hourly Chauffeur' ? details.duration : '',
      stops: journey === 'Hourly Chauffeur' ? details.stops.trim() : '',
    });
    window.history.pushState(
      {},
      '',
      query.size ? `${bookingHref}?${query}` : bookingHref,
    );
  }

  return (
    <>
      <form className="booking-widget" onSubmit={handleSubmit}>
        <fieldset className="booking-widget-fields" disabled={!ready}>
          <div className="booking-heading">
            <div>
              <h2>Where are you headed?</h2>
            </div>
            <p>Plan the details of your journey.</p>
          </div>
          <fieldset className="journey-types">
            <legend className="sr-only">Journey type</legend>
            {journeyTypes.map((type) => (
              <label key={type} className={journey === type ? 'selected' : ''}>
                <input
                  type="radio"
                  name="journey"
                  value={type}
                  checked={journey === type}
                  onChange={() => {
                    setJourney(type);
                    if (
                      publishedServices.find(
                        (service) => service.slug === serviceId,
                      )?.journeyType !== type
                    )
                      setServiceId('');
                  }}
                />
                {type}
              </label>
            ))}
          </fieldset>
          <div className="booking-options">
            <label className="booking-vehicle">
              <span>Service preference (optional)</span>
              <select
                name="service"
                value={serviceId}
                onChange={(event) => {
                  const selected = publishedServices.find(
                    (service) => service.slug === event.target.value,
                  );
                  setServiceId(event.target.value);
                  if (selected) setJourney(selected.journeyType);
                }}
              >
                <option value="">No preference</option>
                {publishedServices.map((service) => (
                  <option key={service.slug} value={service.slug}>
                    {service.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="booking-vehicle">
              <span>Proposed area (optional)</span>
              <select
                name="area"
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
              >
                <option value="">No preference</option>
                {destinations.map((area) => (
                  <option key={area.slug} value={area.slug}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="booking-vehicle">
            <span>Vehicle preference (optional, illustrative)</span>
            <select
              name="vehicle"
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
            >
              <option value="">No preference</option>
              {publishedVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.category} - {vehicle.name}
                </option>
              ))}
            </select>
          </label>
          <div className="booking-fields">
            <label>
              <span>Pickup location</span>
              <input
                name="pickup"
                placeholder="Enter pickup location"
                required
                maxLength={150}
                value={details.pickup}
                onChange={(event) =>
                  setDetails({ ...details, pickup: event.target.value })
                }
              />
            </label>
            <label>
              <span>Destination</span>
              <input
                name="destination"
                placeholder="Enter destination"
                required
                maxLength={150}
                value={details.destination}
                onChange={(event) =>
                  setDetails({ ...details, destination: event.target.value })
                }
              />
            </label>
            <label>
              <span>Pickup date</span>
              <input
                name="date"
                type="date"
                required
                value={details.date}
                onChange={(event) =>
                  setDetails({ ...details, date: event.target.value })
                }
              />
            </label>
            <label>
              <span>Pickup time (Melbourne)</span>
              <input
                name="time"
                type="time"
                required
                value={details.time}
                onChange={(event) =>
                  setDetails({ ...details, time: event.target.value })
                }
              />
            </label>
            <label>
              <span>Passengers</span>
              <input
                name="passengers"
                type="number"
                min="1"
                max="60"
                value={details.passengers}
                onChange={(event) =>
                  setDetails({ ...details, passengers: event.target.value })
                }
                required
              />
            </label>
            <label>
              <span>Luggage</span>
              <input
                name="luggage"
                type="number"
                min="0"
                max="60"
                value={details.luggage}
                onChange={(event) =>
                  setDetails({ ...details, luggage: event.target.value })
                }
                required
              />
            </label>
          </div>
          {journey === 'Airport Transfer' && (
            <label className="booking-vehicle booking-extra">
              <span>Flight number (optional)</span>
              <input
                name="flight"
                maxLength={30}
                value={details.flight}
                onChange={(event) =>
                  setDetails({ ...details, flight: event.target.value })
                }
                placeholder="e.g. QF123"
              />
              <small>
                Flight monitoring and pickup arrangements are not confirmed.
              </small>
            </label>
          )}
          {journey === 'Hourly Chauffeur' && (
            <div className="booking-options booking-extra">
              <label className="booking-vehicle">
                <span>Estimated duration in hours (optional)</span>
                <input
                  name="duration"
                  type="number"
                  min="1"
                  max="720"
                  value={details.duration}
                  onChange={(event) =>
                    setDetails({ ...details, duration: event.target.value })
                  }
                />
              </label>
              <label className="booking-vehicle">
                <span>Additional stops (optional)</span>
                <input
                  name="stops"
                  maxLength={300}
                  value={details.stops}
                  onChange={(event) =>
                    setDetails({ ...details, stops: event.target.value })
                  }
                  placeholder="Proposed stops"
                />
              </label>
            </div>
          )}
          <button className="booking-submit" type="submit" disabled={!ready}>
            Continue booking <span aria-hidden="true">&#8599;</span>
          </button>
        </fieldset>
        <p className="booking-disclaimer">
          Planning only. Enquiries are not yet open; no booking is confirmed.
        </p>
        <p className="booking-error" role="alert">
          {error}
        </p>
        <noscript>
          <p>
            JavaScript is required to plan a journey.{' '}
            <a href={bookingHref}>View booking information</a>.
          </p>
        </noscript>
      </form>
      {handoff && (
        <BookingTakeover
          draft={handoff}
          onExit={closeTakeover}
          onComplete={() => {
            setDetails(emptyDetails);
            setJourney(journeyTypes[0]);
            setError('');
            setVehicleId('');
            setServiceId('');
            setAreaId('');
            setHandoff({});
          }}
        />
      )}
    </>
  );
}
