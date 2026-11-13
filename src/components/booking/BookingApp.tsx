import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  MapPin,
  Plane,
  Repeat2,
  UsersRound,
} from 'lucide-react';
import { business } from '../../data/site';
import { publishedServices } from '../../data/services';
import { destinations } from '../../data/destinations';
import { publishedVehicles } from '../../data/vehicles';
import {
  emptyBooking,
  type BookingDraft,
  type EnquiryReceipt,
  type JourneyType,
} from '../../lib/booking/model';
import {
  eligibleVehicles,
  australianMobile,
  validateBooking,
  validateBookingStep,
  type BookingErrors,
} from '../../lib/booking/validation';
import {
  createApiAdapter,
  type BookingAdapter,
} from '../../lib/booking/adapters';
import { phoneHref, whatsappHref } from '../../lib/booking/integrations';
import { pathFor } from '../../lib/paths';
import { imageAttributes } from '../../lib/images';
import LocationInput from './LocationInput';
import FareEstimate, { quoteRequired } from './FareEstimate';
import { useRouteEstimate } from './useRouteEstimate';
import { formatAud } from '../../lib/pricing/engine';

const steps = [
  'Journey',
  'Details',
  'Vehicle',
  'Requirements',
  'Your details',
  'Review',
];
const types: {
  value: JourneyType;
  title: string;
  description: string;
  icon: typeof Plane;
}[] = [
  {
    value: 'Airport Transfer',
    title: 'Airport Transfer',
    description: 'To or from the airport.',
    icon: Plane,
  },
  {
    value: 'Point-to-Point',
    title: 'Point-to-Point Transfer',
    description: 'A journey between two places.',
    icon: MapPin,
  },
  {
    value: 'Return Journey',
    title: 'Return Journey',
    description: 'Your outward and return plans.',
    icon: Repeat2,
  },
  {
    value: 'Hourly Chauffeur',
    title: 'Hourly Chauffeur',
    description: 'Time for a flexible itinerary.',
    icon: Clock3,
  },
];

type Props = {
  initialDraft?: Partial<BookingDraft>;
  embedded?: boolean;
  onExit?: () => void;
  onBusyChange?: (busy: boolean) => void;
  onComplete?: () => void;
  confirmationOnly?: boolean;
};
type ReceiptView = { receipt: EnquiryReceipt; booking: BookingDraft };

function displayDate(value: string) {
  return value ? value.split('-').reverse().join('/') : 'Not added';
}
function fieldError(errors: BookingErrors, name: keyof BookingDraft) {
  return errors[name]
    ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` }
    : {};
}
function Field({
  label,
  name,
  errors,
  children,
  hint,
}: {
  label: string;
  name: keyof BookingDraft;
  errors: BookingErrors;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="wizard-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
      {errors[name] && (
        <small className="wizard-field-error" id={`${name}-error`}>
          {errors[name]}
        </small>
      )}
    </label>
  );
}

export default function BookingApp({
  initialDraft,
  embedded = false,
  onExit,
  onBusyChange,
  onComplete,
  confirmationOnly = false,
}: Props) {
  const [draft, setDraft] = useState<BookingDraft>({
    ...emptyBooking,
    ...initialDraft,
  });
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receiptView, setReceiptView] = useState<ReceiptView | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(confirmationOnly);
  const [illustrativePreference, setIllustrativePreference] = useState(false);
  const busy = useRef(false);
  const requestId = useRef<string | null>(null);
  const requestCreatedAt = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const configuredVehicles = publishedVehicles.filter(
    (vehicle) => !vehicle.demonstration,
  );
  const eligible = eligibleVehicles(
    configuredVehicles,
    draft.passengers,
    draft.luggage,
  );
  const availableVehicles = configuredVehicles.filter((vehicle) =>
    eligible.some((item) => item.id === vehicle.id),
  );
  const selectedVehicle = configuredVehicles.find(
    (vehicle) => vehicle.id === draft.vehicleId,
  );
  const routing = useRouteEstimate(draft, configuredVehicles, (value) =>
    update('stops', value),
  );
  const outboundRoute =
    routing.route?.status === 'success'
      ? (routing.route.outbound ?? null)
      : null;
  const returnRoute =
    routing.route?.status === 'success'
      ? (routing.route.inbound ?? null)
      : null;
  const selectedQuote =
    routing.quotes.find((quote) => quote.vehicleId === draft.vehicleId) ?? null;
  const apiUrl = import.meta.env.PUBLIC_BOOKING_API_URL?.trim() || '';
  const mode = apiUrl ? 'api' : import.meta.env.DEV ? 'simulation' : 'disabled';

  useEffect(() => {
    if (confirmationOnly) {
      setReady(true);
      return;
    }
    const query = new URLSearchParams(window.location.search);
    let restored: Partial<BookingDraft> = {};
    try {
      const saved = JSON.parse(
        sessionStorage.getItem('karlook-booking-progress') || 'null',
      );
      if (saved && typeof saved === 'object') {
        for (const key of [
          'journey',
          'serviceId',
          'areaId',
          'passengers',
          'luggage',
          'vehicleId',
          'duration',
        ] as const) {
          if (typeof saved[key] === 'string')
            Object.assign(restored, { [key]: saved[key] });
        }
      }
      const request = JSON.parse(
        sessionStorage.getItem('karlook-booking-request') || 'null',
      );
      if (
        request &&
        typeof request.id === 'string' &&
        /^[0-9a-f-]{36}$/i.test(request.id) &&
        typeof request.createdAt === 'string' &&
        !Number.isNaN(Date.parse(request.createdAt))
      ) {
        requestId.current = request.id;
        requestCreatedAt.current = request.createdAt;
      }
      sessionStorage.removeItem('karlook-journey');
    } catch {
      restored = {};
    }
    const service = publishedServices.find(
      (item) => item.slug === query.get('service'),
    );
    const area = destinations.find(
      (item) => item.slug === query.get('destination'),
    );
    const vehicle = configuredVehicles.find(
      (item) => item.id === query.get('vehicle'),
    );
    setIllustrativePreference(
      publishedVehicles.some(
        (item) =>
          item.demonstration &&
          item.id === (query.get('vehicle') || initialDraft?.vehicleId),
      ),
    );
    setDraft((current) => {
      const next = { ...current, ...restored, ...initialDraft };
      if (service) {
        next.serviceId = service.slug;
        next.journey = service.journeyType;
      }
      if (area) {
        next.areaId = area.slug;
        if (!service && !initialDraft?.journey && !restored.journey)
          next.journey =
            area.slug === 'melbourne-airport'
              ? 'Airport Transfer'
              : 'Point-to-Point';
      }
      if (vehicle) next.vehicleId = vehicle.id;
      if (!configuredVehicles.some((item) => item.id === next.vehicleId))
        next.vehicleId = '';
      if (!publishedServices.some((item) => item.slug === next.serviceId))
        next.serviceId = '';
      if (!destinations.some((item) => item.slug === next.areaId))
        next.areaId = '';
      if (!types.some((item) => item.value === next.journey))
        next.journey = 'Point-to-Point';
      return next;
    });
    setReady(true);
    const handlePopState = () =>
      setShowConfirmation(
        window.location.pathname.replace(/\/$/, '') ===
          pathFor('/booking/confirmation/').replace(/\/$/, ''),
      );
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      controller.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!ready || showConfirmation) return;
    try {
      const {
        journey,
        serviceId,
        areaId,
        passengers,
        luggage,
        vehicleId,
        duration,
      } = draft;
      sessionStorage.setItem(
        'karlook-booking-progress',
        JSON.stringify({
          journey,
          serviceId,
          areaId,
          passengers,
          luggage,
          vehicleId,
          duration,
        }),
      );
    } catch {
      setSubmitError(
        'Progress cannot be saved in this browser; you can still continue while this page is open.',
      );
    }
  }, [draft, ready, showConfirmation]);

  function update<K extends keyof BookingDraft>(
    key: K,
    value: BookingDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  function goTo(next: number) {
    setErrors({});
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentErrors = validateBookingStep(step, draft, configuredVehicles);
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length) return;
    const nextStep = Math.min(step + 1, steps.length - 1);
    if (
      step === 1 &&
      draft.vehicleId &&
      !eligible.some((vehicle) => vehicle.id === draft.vehicleId)
    )
      update('vehicleId', '');
    setFurthest((current) => Math.max(current, nextStep));
    goTo(nextStep);
  }
  function clearProgress() {
    try {
      sessionStorage.removeItem('karlook-booking-progress');
      sessionStorage.removeItem('karlook-journey');
      sessionStorage.removeItem('karlook-booking-request');
    } catch {
      setSubmitError('Unable to clear saved progress in this browser.');
    }
  }
  function cancel() {
    if (busy.current) return;
    if (
      (draft.pickup || draft.destination || draft.firstName || draft.email) &&
      !window.confirm('Discard this journey and clear your details?')
    )
      return;
    controller.current?.abort();
    clearProgress();
    routing.clear();
    setDraft({ ...emptyBooking });
    setReceiptView(null);
    if (onExit) onExit();
    else window.location.assign(pathFor('/'));
  }
  async function submit() {
    if (busy.current || mode === 'disabled' || (mode === 'api' && routing.demo))
      return;
    const allErrors = validateBooking(draft, configuredVehicles);
    const invalidStep = allErrors.findIndex(
      (entry) => Object.keys(entry).length > 0,
    );
    if (invalidStep >= 0) {
      setStep(invalidStep);
      setErrors(allErrors[invalidStep]);
      requestAnimationFrame(() => heading.current?.focus());
      return;
    }
    busy.current = true;
    onBusyChange?.(true);
    setSubmitting(true);
    setSubmitError('');
    const abort = new AbortController();
    controller.current = abort;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, 15000);
    try {
      if (!requestId.current) {
        requestId.current = crypto.randomUUID();
        requestCreatedAt.current = new Date().toISOString();
      }
      try {
        sessionStorage.setItem(
          'karlook-booking-request',
          JSON.stringify({
            id: requestId.current,
            createdAt: requestCreatedAt.current,
          }),
        );
      } catch {
        if (mode === 'api')
          throw new Error(
            'Browser session storage is required to safely retry an enquiry.',
          );
      }
      const cleaned = {
        ...draft,
        pickup: draft.pickup.trim(),
        destination: draft.destination.trim(),
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        mobile: australianMobile(draft.mobile)?.number ?? draft.mobile.trim(),
        returnDate: draft.journey === 'Return Journey' ? draft.returnDate : '',
        returnTime: draft.journey === 'Return Journey' ? draft.returnTime : '',
        duration: draft.journey === 'Hourly Chauffeur' ? draft.duration : '',
      };
      let adapter: BookingAdapter;
      if (mode === 'api')
        adapter = createApiAdapter(apiUrl, fetch, import.meta.env.DEV);
      else if (import.meta.env.DEV) {
        const { createMockAdapter } = await import('../../lib/booking/mock');
        adapter = createMockAdapter(
          import.meta.env.PUBLIC_BOOKING_MOCK_FAIL === 'true',
        );
      } else throw new Error('Live submission is not enabled.');
      const receipt = await adapter.submit(
        {
          clientRequestId: requestId.current,
          createdAt: requestCreatedAt.current ?? new Date().toISOString(),
          booking: cleaned,
          ...(outboundRoute && !outboundRoute.simulated
            ? {
                routeReference: {
                  routeId: outboundRoute.routeId,
                  returnRouteId: returnRoute?.routeId ?? null,
                  ...(selectedQuote &&
                  Date.parse(selectedQuote.expiresAt) > Date.now()
                    ? { quoteId: selectedQuote.quoteId }
                    : {}),
                },
              }
            : {}),
        },
        abort.signal,
      );
      clearProgress();
      routing.clear();
      requestId.current = null;
      requestCreatedAt.current = null;
      setReceiptView({ receipt, booking: cleaned });
      setDraft({ ...emptyBooking });
      setStep(0);
      setFurthest(0);
      onComplete?.();
      setShowConfirmation(true);
      window.history.pushState({}, '', pathFor('/booking/confirmation/'));
      requestAnimationFrame(() => heading.current?.focus());
    } catch (error) {
      if (timedOut)
        setSubmitError(
          'The server did not respond. Receipt is unknown; retry with the same details or contact support before starting another enquiry.',
        );
      else if (!abort.signal.aborted)
        setSubmitError(
          error instanceof TypeError
            ? 'The server could not be reached. Receipt is unknown; retry with the same details or contact support.'
            : error instanceof Error
              ? error.message
              : 'Unable to submit the enquiry. Please try again.',
        );
    } finally {
      window.clearTimeout(timeout);
      busy.current = false;
      onBusyChange?.(false);
      setSubmitting(false);
      controller.current = null;
    }
  }

  if (!ready)
    return (
      <div className="booking-app">
        <div className="booking-intro">
          <div className="container">
            <h1>
              {confirmationOnly
                ? 'Enquiry acknowledgement.'
                : 'Plan your journey.'}
            </h1>
            <p role="status">Preparing your journey...</p>
          </div>
        </div>
      </div>
    );
  if (showConfirmation) {
    if (!receiptView)
      return (
        <div
          className={`booking-app ${embedded ? 'booking-app--embedded' : ''}`}
        >
          <div className="booking-intro">
            <div className="container">
              <h1>No enquiry to display.</h1>
              <p>
                Acknowledgement details are only available immediately after an
                accepted enquiry.
              </p>
              <a className="button" href={pathFor('/booking/')}>
                Start an enquiry <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      );
    const { receipt, booking } = receiptView;
    const vehicle = configuredVehicles.find(
      (item) => item.id === booking.vehicleId,
    );
    return (
      <div className={`booking-app ${embedded ? 'booking-app--embedded' : ''}`}>
        <div className="booking-intro">
          <div className="container">
            <h1 tabIndex={-1} ref={heading}>
              {receipt.status === 'simulated'
                ? 'Simulation complete.'
                : 'Your journey starts here.'}
            </h1>
            <p>
              {receipt.status === 'simulated'
                ? 'No enquiry was sent. This is a development-only simulation, not a booking or a submitted request.'
                : 'Thank you for choosing karLook. Your booking enquiry has been received and is awaiting review by our team.'}
            </p>
          </div>
        </div>
        <div className="container acknowledgement">
          <div>
            <p className="wizard-kicker">
              {receipt.status === 'simulated'
                ? 'TEST REFERENCE'
                : 'ENQUIRY REFERENCE'}
            </p>
            <h2>{receipt.reference}</h2>
            <p>
              {receipt.status === 'simulated'
                ? 'This reference is for testing only.'
                : 'This is an enquiry receipt, not a confirmed reservation. Our team will review your request.'}
            </p>
            <dl className="review-list">
              <div>
                <dt>Journey</dt>
                <dd>{booking.journey}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>
                  {booking.pickup} to {booking.destination}
                </dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>
                  {displayDate(booking.date)} at {booking.time} Melbourne time
                </dd>
              </div>
              {booking.journey === 'Return Journey' && (
                <div>
                  <dt>Return</dt>
                  <dd>
                    {displayDate(booking.returnDate)} at {booking.returnTime}
                  </dd>
                </div>
              )}
              <div>
                <dt>Passengers and luggage</dt>
                <dd>
                  {booking.passengers} passengers · {booking.luggage} bags
                </dd>
              </div>
              <div>
                <dt>Vehicle preference</dt>
                <dd>{vehicle?.name ?? 'No preference'}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>
                  {booking.firstName} {booking.lastName} · {booking.email} ·{' '}
                  {australianMobile(booking.mobile)?.formatInternational() ??
                    booking.mobile}
                </dd>
              </div>
            </dl>
            <button
              className="wizard-secondary"
              type="button"
              onClick={() => {
                setReceiptView(null);
                setShowConfirmation(false);
                setStep(0);
                setFurthest(0);
                requestId.current = null;
                window.history.replaceState({}, '', pathFor('/booking/'));
              }}
            >
              Start another enquiry <ArrowRight size={16} />
            </button>
            {embedded && (
              <button
                className="wizard-cancel"
                type="button"
                onClick={() => {
                  setReceiptView(null);
                  onExit?.();
                }}
              >
                Close
              </button>
            )}
          </div>
          <aside>
            <h3>Next steps</h3>
            <p>
              {receipt.status === 'simulated'
                ? 'Live enquiries are not enabled in this simulation.'
                : 'Your request awaits manual review. No vehicle or reservation is confirmed yet.'}
            </p>
            {business.contact.phone && (
              <a href={phoneHref(business.contact.phone)}>
                Call {business.contact.phone}
              </a>
            )}
            {business.contact.email && (
              <a href={`mailto:${business.contact.email}`}>
                Email {business.contact.email}
              </a>
            )}
            {business.contact.whatsapp && (
              <a href={whatsappHref(business.contact.whatsapp)}>WhatsApp</a>
            )}
            {!business.contact.phone &&
              !business.contact.email &&
              !business.contact.whatsapp && (
                <p>Support contact details are being finalised.</p>
              )}
            <a href={pathFor('/contact/')}>
              Contact information <ArrowRight size={14} />
            </a>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className={`booking-app ${embedded ? 'booking-app--embedded' : ''}`}>
      {embedded && (
        <div className="booking-overlay-header">
          <a
            className="wordmark"
            href={pathFor('/')}
            onClick={(event) => {
              event.preventDefault();
              cancel();
            }}
          >
            kar<span>Look</span>
            <i>.</i>
          </a>
          <button type="button" onClick={cancel} disabled={submitting}>
            Close <span aria-hidden="true">&#10005;</span>
          </button>
        </div>
      )}
      <div className="booking-intro">
        <div className="container">
          <h1>Plan your journey.</h1>
          <p>
            An enquiry, thoughtfully arranged. Requests require manual review
            and confirmation.
          </p>
        </div>
      </div>
      <div className="container booking-main">
        {mode !== 'api' && (
          <p className="wizard-mode-notice" role="status">
            {mode === 'simulation'
              ? 'Development simulation only. No enquiry will be sent.'
              : 'Live submission is not yet enabled. No enquiry will be sent.'}
          </p>
        )}
        <nav className="wizard-progress" aria-label="Booking progress">
          <ol>
            {steps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={index > furthest || submitting}
                  aria-current={index === step ? 'step' : undefined}
                >
                  <span>
                    {index < step ? (
                      <Check size={14} aria-hidden="true" />
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </span>
                  <strong>{label}</strong>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <details className="wizard-mobile-summary">
          <summary>
            Journey summary <span aria-hidden="true">+</span>
          </summary>
          <dl className="review-list">
            <div>
              <dt>Journey</dt>
              <dd>{draft.journey}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{draft.pickup || 'Not added'}</dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>{draft.destination || 'Not added'}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {draft.date
                  ? `${displayDate(draft.date)}${draft.time ? ` · ${draft.time}` : ''}`
                  : 'Not added'}
              </dd>
            </div>
            <div>
              <dt>Travellers</dt>
              <dd>
                {draft.passengers} passengers · {draft.luggage} bags
              </dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>{selectedVehicle?.name ?? 'No preference'}</dd>
            </div>
          </dl>
        </details>
        <div className="wizard-layout">
          <form
            key={step}
            className="wizard-content"
            onSubmit={next}
            noValidate
          >
            <p className="wizard-kicker">
              STEP {String(step + 1).padStart(2, '0')} /{' '}
              {String(steps.length).padStart(2, '0')}
            </p>
            <h2 tabIndex={-1} ref={heading}>
              {
                [
                  'How are you travelling?',
                  'Tell us about your journey.',
                  'Choose your vehicle preference.',
                  'A little more detail.',
                  'Your details.',
                  'Review your enquiry.',
                ][step]
              }
            </h2>
            <p className="wizard-lead">
              {
                [
                  'Choose the journey that best suits your plans.',
                  routing.enabled && !routing.demo
                    ? 'All times are local to Melbourne. Address searches and selected places are sent to the configured mapping service.'
                    : 'All times are local to Melbourne. Addresses stay in this page until you submit.',
                  'Vehicle preferences are subject to manual confirmation.',
                  'Tell us anything that will help us understand your needs.',
                  'We will use these details only to respond to your enquiry.',
                  'Please check the details before sending your request.',
                ][step]
              }
            </p>
            {Object.keys(errors).length > 0 && (
              <div className="wizard-alert" role="alert">
                Please review the highlighted fields.
              </div>
            )}
            {step === 0 && (
              <>
                <fieldset className="wizard-journeys">
                  <legend className="sr-only">Journey type</legend>
                  {types.map((type) => {
                    const Icon = type.icon;
                    return (
                      <label
                        key={type.value}
                        className={
                          draft.journey === type.value ? 'is-selected' : ''
                        }
                      >
                        <input
                          type="radio"
                          name="journey"
                          value={type.value}
                          checked={draft.journey === type.value}
                          onChange={() => {
                            setDraft((current) => ({
                              ...current,
                              journey: type.value,
                              serviceId:
                                publishedServices.find(
                                  (service) =>
                                    service.slug === current.serviceId,
                                )?.journeyType === type.value
                                  ? current.serviceId
                                  : '',
                            }));
                            setErrors({});
                          }}
                        />
                        <Icon size={22} aria-hidden="true" />
                        <span>
                          <strong>{type.title}</strong>
                          <small>{type.description}</small>
                        </span>
                        <span
                          className="wizard-radio-mark"
                          aria-hidden="true"
                        ></span>
                      </label>
                    );
                  })}
                </fieldset>
                <div className="wizard-fields wizard-preferences">
                  <Field
                    label="Service preference (optional)"
                    name="serviceId"
                    errors={errors}
                  >
                    <select
                      value={draft.serviceId}
                      onChange={(event) => {
                        const service = publishedServices.find(
                          (item) => item.slug === event.target.value,
                        );
                        setDraft((current) => ({
                          ...current,
                          serviceId: event.target.value,
                          journey: service?.journeyType ?? current.journey,
                        }));
                      }}
                    >
                      <option value="">No preference</option>
                      {publishedServices.map((service) => (
                        <option key={service.slug} value={service.slug}>
                          {service.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Proposed area (optional)"
                    name="areaId"
                    errors={errors}
                    hint="Service coverage is subject to confirmation."
                  >
                    <select
                      value={draft.areaId}
                      onChange={(event) => update('areaId', event.target.value)}
                    >
                      <option value="">No preference</option>
                      {destinations.map((area) => (
                        <option key={area.slug} value={area.slug}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </>
            )}
            {step === 1 && (
              <div className="wizard-fields">
                <LocationInput
                  label="Pickup location"
                  name="pickup"
                  value={draft.pickup}
                  selected={routing.origin}
                  provider={routing.provider}
                  error={errors.pickup}
                  required
                  onChange={(value) => {
                    routing.setOrigin(null);
                    update('pickup', value);
                  }}
                  onSelect={(place) => {
                    routing.setOrigin(place);
                    update('pickup', place.formattedAddress);
                  }}
                />
                <LocationInput
                  label="Destination"
                  name="destination"
                  value={draft.destination}
                  selected={routing.destination}
                  provider={routing.provider}
                  error={errors.destination}
                  required
                  onChange={(value) => {
                    routing.setDestination(null);
                    update('destination', value);
                  }}
                  onSelect={(place) => {
                    routing.setDestination(place);
                    update('destination', place.formattedAddress);
                  }}
                />
                <Field
                  label="Pickup date"
                  name="date"
                  errors={errors}
                  hint="DD/MM/YYYY"
                >
                  <input
                    name="date"
                    type="date"
                    required
                    value={draft.date}
                    onChange={(event) => update('date', event.target.value)}
                    {...fieldError(errors, 'date')}
                  />
                </Field>
                <Field
                  label="Pickup time (Melbourne)"
                  name="time"
                  errors={errors}
                >
                  <input
                    name="time"
                    type="time"
                    required
                    value={draft.time}
                    onChange={(event) => update('time', event.target.value)}
                    {...fieldError(errors, 'date')}
                  />
                </Field>
                {draft.journey === 'Return Journey' && (
                  <>
                    <Field
                      label="Return date"
                      name="returnDate"
                      errors={errors}
                      hint="DD/MM/YYYY"
                    >
                      <input
                        name="returnDate"
                        type="date"
                        required
                        value={draft.returnDate}
                        onChange={(event) =>
                          update('returnDate', event.target.value)
                        }
                        {...fieldError(errors, 'returnDate')}
                      />
                    </Field>
                    <Field
                      label="Return time (Melbourne)"
                      name="returnTime"
                      errors={errors}
                    >
                      <input
                        name="returnTime"
                        type="time"
                        required
                        value={draft.returnTime}
                        onChange={(event) =>
                          update('returnTime', event.target.value)
                        }
                        {...fieldError(errors, 'returnDate')}
                      />
                    </Field>
                  </>
                )}
                <Field label="Passengers" name="passengers" errors={errors}>
                  <input
                    name="passengers"
                    type="number"
                    required
                    min="1"
                    max="60"
                    value={draft.passengers}
                    onChange={(event) =>
                      update('passengers', event.target.value)
                    }
                    {...fieldError(errors, 'passengers')}
                  />
                </Field>
                <Field label="Luggage" name="luggage" errors={errors}>
                  <input
                    name="luggage"
                    type="number"
                    required
                    min="0"
                    max="60"
                    value={draft.luggage}
                    onChange={(event) => update('luggage', event.target.value)}
                    {...fieldError(errors, 'luggage')}
                  />
                </Field>
                {draft.journey === 'Hourly Chauffeur' && (
                  <Field
                    label="Estimated duration (hours)"
                    name="duration"
                    errors={errors}
                  >
                    <input
                      name="duration"
                      type="number"
                      required
                      min="1"
                      max="720"
                      value={draft.duration}
                      onChange={(event) =>
                        update('duration', event.target.value)
                      }
                      {...fieldError(errors, 'duration')}
                    />
                  </Field>
                )}
                {routing.enabled && routing.provider ? (
                  <div className="route-stops wizard-wide">
                    <div className="route-stops-heading">
                      <strong>Additional stops</strong>
                      <button
                        type="button"
                        onClick={routing.addStop}
                        disabled={routing.stops.length >= 10}
                      >
                        Add stop
                      </button>
                    </div>
                    {routing.stops.map((stop, index) => (
                      <div className="route-stop" key={index}>
                        <LocationInput
                          label={`Stop ${index + 1}`}
                          name={`stop-${index}`}
                          value={stop.value}
                          selected={stop.place}
                          provider={routing.provider}
                          onChange={(value) =>
                            routing.changeStop(index, value, null)
                          }
                          onSelect={(place) =>
                            routing.changeStop(
                              index,
                              place.formattedAddress,
                              place,
                            )
                          }
                        />
                        <button
                          type="button"
                          className="route-remove"
                          onClick={() => routing.removeStop(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {errors.stops && (
                      <p className="wizard-field-error" role="alert">
                        {errors.stops}
                      </p>
                    )}
                  </div>
                ) : (
                  <Field
                    label="Additional stops (optional)"
                    name="stops"
                    errors={errors}
                  >
                    <input
                      name="stops"
                      maxLength={3100}
                      value={draft.stops}
                      placeholder="Enter proposed stops"
                      onChange={(event) => update('stops', event.target.value)}
                      {...fieldError(errors, 'stops')}
                    />
                  </Field>
                )}
                {draft.journey === 'Airport Transfer' && (
                  <Field
                    label="Flight number (optional)"
                    name="flight"
                    errors={errors}
                    hint="Flight monitoring and pickup arrangements are not confirmed."
                  >
                    <input
                      name="flight"
                      maxLength={30}
                      value={draft.flight}
                      placeholder="e.g. QF123"
                      onChange={(event) => update('flight', event.target.value)}
                      {...fieldError(errors, 'flight')}
                    />
                  </Field>
                )}
                <div className="route-status wizard-wide" aria-live="polite">
                  {routing.demo ? (
                    <p className="route-demo-label">
                      DEMONSTRATION ONLY. Suggested locations and distances are
                      simulated, not Google Maps data.
                    </p>
                  ) : routing.enabled ? (
                    <p>
                      Address searches are sent to the configured mapping
                      service. Select suggestions to calculate a driving route.
                    </p>
                  ) : (
                    <p>
                      Address autocomplete and road-distance calculation are not
                      configured. You may continue with a manual enquiry.
                    </p>
                  )}
                  {routing.providerError && <p>{routing.providerError}</p>}
                  {routing.route?.status === 'loading' && (
                    <p>Calculating driving route...</p>
                  )}
                  {routing.route?.status === 'error' && (
                    <p>
                      {routing.route.message}{' '}
                      <button type="button" onClick={routing.retry}>
                        Try again
                      </button>
                    </p>
                  )}
                  {outboundRoute && (
                    <FareEstimate
                      route={outboundRoute}
                      returnRoute={returnRoute}
                      quote={null}
                      vehicleName=""
                      origin={draft.pickup}
                      destination={draft.destination}
                    />
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="wizard-vehicles">
                {illustrativePreference && (
                  <p className="wizard-notice">
                    The previously selected vehicle was illustrative, not
                    confirmed inventory. Please continue without a preference or
                    choose a verified vehicle if available.
                  </p>
                )}
                <label
                  className={`wizard-no-preference ${!draft.vehicleId ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    checked={!draft.vehicleId}
                    onChange={() => update('vehicleId', '')}
                  />
                  <span>
                    <strong>No vehicle preference</strong>
                    <small>Our team can discuss a suitable option.</small>
                  </span>
                </label>
                {availableVehicles.length === 0 && (
                  <p className="wizard-notice">
                    No verified vehicles are configured for selection. Continue
                    without a vehicle preference; fleet availability and
                    suitability require confirmation.
                  </p>
                )}
                {availableVehicles.map((vehicle) => (
                  <label
                    className={`wizard-vehicle ${draft.vehicleId === vehicle.id ? 'is-selected' : ''}`}
                    key={vehicle.id}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.id}
                      checked={draft.vehicleId === vehicle.id}
                      onChange={() => update('vehicleId', vehicle.id)}
                    />
                    <img
                      {...imageAttributes(pathFor(vehicle.heroImage))}
                      alt={vehicle.name}
                      loading="lazy"
                      sizes="(max-width: 600px) 100vw, 200px"
                    />
                    <span>
                      <small>{vehicle.category}</small>
                      <strong>{vehicle.name}</strong>
                      <small>
                        {vehicle.capacityVerified
                          ? `${vehicle.passengers} passengers · ${vehicle.luggage} bags`
                          : 'Capacity to be confirmed'}
                      </small>
                      <small>{vehicle.amenities.join(' · ')}</small>
                      <small>{vehicle.description}</small>
                      {routing.quotes.find(
                        (quote) => quote.vehicleId === vehicle.id,
                      ) && (
                        <small className="vehicle-estimate">
                          Estimated fare:{' '}
                          {formatAud(
                            routing.quotes.find(
                              (quote) => quote.vehicleId === vehicle.id,
                            )!.totalCents,
                          )}{' '}
                          · subject to confirmation
                        </small>
                      )}
                      <b>
                        {draft.vehicleId === vehicle.id
                          ? 'Selected'
                          : 'Select vehicle'}{' '}
                        <ArrowRight size={14} aria-hidden="true" />
                      </b>
                    </span>
                  </label>
                ))}
                {errors.vehicleId && (
                  <p className="wizard-field-error" role="alert">
                    {errors.vehicleId}
                  </p>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="wizard-fields">
                <label className="wizard-checkbox wizard-wide">
                  <input
                    type="checkbox"
                    checked={Number(draft.childSeats) > 0}
                    onChange={(event) =>
                      update('childSeats', event.target.checked ? '1' : '0')
                    }
                  />
                  <span>Request child seats</span>
                </label>
                {Number(draft.childSeats) > 0 && (
                  <Field
                    label="Number of child seats"
                    name="childSeats"
                    errors={errors}
                  >
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={draft.childSeats}
                      onChange={(event) =>
                        update('childSeats', event.target.value)
                      }
                      {...fieldError(errors, 'childSeats')}
                    />
                  </Field>
                )}
                <Field
                  label="Expected waiting time in minutes (optional)"
                  name="waitingMinutes"
                  errors={errors}
                  hint="Leave blank if unknown; any waiting charge requires confirmation."
                >
                  <input
                    name="waitingMinutes"
                    type="number"
                    min="0"
                    max="10080"
                    value={draft.waitingMinutes}
                    onChange={(event) =>
                      update('waitingMinutes', event.target.value)
                    }
                    {...fieldError(errors, 'waitingMinutes')}
                  />
                </Field>
                <Field
                  label="Additional stops (optional)"
                  name="stops"
                  errors={errors}
                >
                  <input
                    maxLength={3100}
                    value={draft.stops}
                    onChange={(event) => update('stops', event.target.value)}
                    {...fieldError(errors, 'stops')}
                  />
                </Field>
                <Field
                  label="Flight number (optional)"
                  name="flight"
                  errors={errors}
                  hint="Flight monitoring is not confirmed."
                >
                  <input
                    maxLength={30}
                    value={draft.flight}
                    onChange={(event) => update('flight', event.target.value)}
                    {...fieldError(errors, 'flight')}
                  />
                </Field>
                <Field
                  label="Special pickup instructions (optional)"
                  name="pickupInstructions"
                  errors={errors}
                >
                  <textarea
                    maxLength={500}
                    value={draft.pickupInstructions}
                    onChange={(event) =>
                      update('pickupInstructions', event.target.value)
                    }
                    {...fieldError(errors, 'pickupInstructions')}
                  />
                </Field>
                <Field
                  label="Accessibility requirements (optional)"
                  name="accessibilityRequirements"
                  errors={errors}
                  hint="Please describe your needs; suitable arrangements must be confirmed."
                >
                  <textarea
                    maxLength={500}
                    value={draft.accessibilityRequirements}
                    onChange={(event) =>
                      update('accessibilityRequirements', event.target.value)
                    }
                    {...fieldError(errors, 'accessibilityRequirements')}
                  />
                </Field>
                <Field
                  label="Other special requests (optional)"
                  name="specialRequests"
                  errors={errors}
                >
                  <textarea
                    maxLength={500}
                    value={draft.specialRequests}
                    onChange={(event) =>
                      update('specialRequests', event.target.value)
                    }
                    {...fieldError(errors, 'specialRequests')}
                  />
                </Field>
              </div>
            )}
            {step === 4 && (
              <div className="wizard-fields">
                <Field label="First name" name="firstName" errors={errors}>
                  <input
                    name="firstName"
                    required
                    autoComplete="given-name"
                    maxLength={80}
                    value={draft.firstName}
                    onChange={(event) =>
                      update('firstName', event.target.value)
                    }
                    {...fieldError(errors, 'firstName')}
                  />
                </Field>
                <Field label="Last name" name="lastName" errors={errors}>
                  <input
                    name="lastName"
                    required
                    autoComplete="family-name"
                    maxLength={80}
                    value={draft.lastName}
                    onChange={(event) => update('lastName', event.target.value)}
                    {...fieldError(errors, 'lastName')}
                  />
                </Field>
                <Field label="Email" name="email" errors={errors}>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    maxLength={254}
                    value={draft.email}
                    onChange={(event) => update('email', event.target.value)}
                    {...fieldError(errors, 'email')}
                  />
                </Field>
                <div className="wizard-phone">
                  <Field
                    label="Country code"
                    name="countryCode"
                    errors={errors}
                  >
                    <select
                      value={draft.countryCode}
                      onChange={() => update('countryCode', '+61')}
                    >
                      <option value="+61">+61 Australia</option>
                    </select>
                  </Field>
                  <Field
                    label="Australian mobile"
                    name="mobile"
                    errors={errors}
                  >
                    <input
                      name="mobile"
                      type="tel"
                      required
                      autoComplete="tel-national"
                      maxLength={25}
                      placeholder="04XX XXX XXX"
                      value={draft.mobile}
                      onChange={(event) => update('mobile', event.target.value)}
                      {...fieldError(errors, 'mobile')}
                    />
                  </Field>
                </div>
                <Field
                  label="Additional notes (optional)"
                  name="notes"
                  errors={errors}
                >
                  <textarea
                    name="notes"
                    maxLength={500}
                    value={draft.notes}
                    onChange={(event) => update('notes', event.target.value)}
                    {...fieldError(errors, 'notes')}
                  />
                </Field>
                <label className="wizard-checkbox wizard-wide">
                  <input
                    type="checkbox"
                    required
                    checked={draft.privacyAccepted}
                    onChange={(event) =>
                      update('privacyAccepted', event.target.checked)
                    }
                    {...fieldError(errors, 'privacyAccepted')}
                  />
                  <span>
                    I consent to my details being used to process this enquiry.
                    The <a href={pathFor('/legal/privacy/')}>privacy notice</a>{' '}
                    is being prepared.
                  </span>
                </label>
                {errors.privacyAccepted && (
                  <p
                    className="wizard-field-error wizard-wide"
                    id="privacyAccepted-error"
                  >
                    {errors.privacyAccepted}
                  </p>
                )}
              </div>
            )}
            {step === 5 && (
              <>
                <div className="wizard-review">
                  <section>
                    <div>
                      <h3>Journey</h3>
                      <button type="button" onClick={() => goTo(0)}>
                        Edit
                      </button>
                    </div>
                    <dl className="review-list">
                      <div>
                        <dt>Type</dt>
                        <dd>{draft.journey}</dd>
                      </div>
                      <div>
                        <dt>Service</dt>
                        <dd>
                          {publishedServices.find(
                            (item) => item.slug === draft.serviceId,
                          )?.title ?? 'No preference'}
                        </dd>
                      </div>
                      <div>
                        <dt>Proposed area</dt>
                        <dd>
                          {destinations.find(
                            (item) => item.slug === draft.areaId,
                          )?.name ?? 'No preference'}
                        </dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <div>
                      <h3>Journey details</h3>
                      <button type="button" onClick={() => goTo(1)}>
                        Edit
                      </button>
                    </div>
                    <dl className="review-list">
                      <div>
                        <dt>Pickup</dt>
                        <dd>{draft.pickup}</dd>
                      </div>
                      <div>
                        <dt>Destination</dt>
                        <dd>{draft.destination}</dd>
                      </div>
                      <div>
                        <dt>Pickup date and time</dt>
                        <dd>
                          {displayDate(draft.date)} at {draft.time} Melbourne
                          time
                        </dd>
                      </div>
                      {draft.journey === 'Return Journey' && (
                        <div>
                          <dt>Return</dt>
                          <dd>
                            {displayDate(draft.returnDate)} at{' '}
                            {draft.returnTime}
                          </dd>
                        </div>
                      )}
                      {draft.journey === 'Hourly Chauffeur' && (
                        <div>
                          <dt>Duration</dt>
                          <dd>{draft.duration} hours</dd>
                        </div>
                      )}
                      <div>
                        <dt>Passengers and luggage</dt>
                        <dd>
                          {draft.passengers} passengers · {draft.luggage} bags
                        </dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <div>
                      <h3>Vehicle preference</h3>
                      <button type="button" onClick={() => goTo(2)}>
                        Edit
                      </button>
                    </div>
                    <p>
                      {selectedVehicle?.name ??
                        'No preference. Vehicle allocation is not confirmed.'}
                    </p>
                  </section>
                  <section>
                    <div>
                      <h3>Additional requirements</h3>
                      <button type="button" onClick={() => goTo(3)}>
                        Edit
                      </button>
                    </div>
                    <dl className="review-list">
                      <div>
                        <dt>Child seats</dt>
                        <dd>{draft.childSeats}</dd>
                      </div>
                      <div>
                        <dt>Expected waiting</dt>
                        <dd>
                          {draft.waitingMinutes === ''
                            ? 'Not specified'
                            : `${draft.waitingMinutes} minutes`}
                        </dd>
                      </div>
                      <div>
                        <dt>Stops</dt>
                        <dd>{draft.stops || 'None specified'}</dd>
                      </div>
                      <div>
                        <dt>Flight number</dt>
                        <dd>{draft.flight || 'None specified'}</dd>
                      </div>
                      <div>
                        <dt>Pickup instructions</dt>
                        <dd>{draft.pickupInstructions || 'None specified'}</dd>
                      </div>
                      <div>
                        <dt>Accessibility</dt>
                        <dd>
                          {draft.accessibilityRequirements || 'None specified'}
                        </dd>
                      </div>
                      <div>
                        <dt>Other requests</dt>
                        <dd>{draft.specialRequests || 'None specified'}</dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <div>
                      <h3>Your details</h3>
                      <button type="button" onClick={() => goTo(4)}>
                        Edit
                      </button>
                    </div>
                    <dl className="review-list">
                      <div>
                        <dt>Name</dt>
                        <dd>
                          {draft.firstName} {draft.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{draft.email}</dd>
                      </div>
                      <div>
                        <dt>Mobile</dt>
                        <dd>
                          {australianMobile(
                            draft.mobile,
                          )?.formatInternational() ?? draft.mobile}
                        </dd>
                      </div>
                      <div>
                        <dt>Notes</dt>
                        <dd>{draft.notes || 'None specified'}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
                <FareEstimate
                  route={outboundRoute}
                  returnRoute={returnRoute}
                  quote={selectedQuote}
                  vehicleName={selectedVehicle?.name ?? ''}
                  origin={draft.pickup}
                  destination={draft.destination}
                  quoteStatus={
                    routing.quoteStatus === 'loading'
                      ? 'Checking configured vehicle estimates...'
                      : undefined
                  }
                />
                {routing.quoteError && (
                  <p className="wizard-notice">
                    {routing.quoteError} {quoteRequired}{' '}
                    <button type="button" onClick={routing.retry}>
                      Try again
                    </button>
                  </p>
                )}
                <p className="wizard-notice">
                  {mode === 'api' && routing.demo
                    ? 'Demonstration routing is enabled. Live enquiry submission is disabled until it is turned off.'
                    : mode === 'api'
                      ? 'Submitting sends your details to the configured enquiry service. Receipt is not a confirmed reservation.'
                      : mode === 'simulation'
                        ? 'Live submission is not enabled. The button below runs a development-only simulation; no enquiry will be sent.'
                        : 'Live submission is not yet enabled. Your details will not be sent.'}
                </p>
                {submitError && (
                  <p className="wizard-alert" role="alert">
                    {submitError}
                  </p>
                )}
              </>
            )}
            <div className="wizard-actions">
              {step > 0 ? (
                <button
                  className="wizard-secondary"
                  type="button"
                  onClick={() => goTo(step - 1)}
                  disabled={submitting}
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <button
                  className="wizard-cancel"
                  type="button"
                  onClick={cancel}
                >
                  Cancel
                </button>
              )}
              {step < 5 ? (
                <button className="wizard-primary" type="submit">
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="wizard-primary"
                  type="button"
                  onClick={submit}
                  disabled={
                    submitting ||
                    mode === 'disabled' ||
                    (mode === 'api' && routing.demo)
                  }
                >
                  {submitting
                    ? 'Submitting...'
                    : mode === 'simulation'
                      ? 'Run simulated enquiry'
                      : 'Submit enquiry'}{' '}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
            {step > 0 && (
              <button
                className="wizard-cancel wizard-cancel-end"
                type="button"
                onClick={cancel}
                disabled={submitting}
              >
                Cancel enquiry
              </button>
            )}
          </form>
          <aside className="wizard-sidebar">
            <p className="wizard-kicker">YOUR JOURNEY</p>
            <h2>
              A considered
              <br />
              <em>way to travel.</em>
            </h2>
            <dl className="review-list">
              <div>
                <dt>Journey</dt>
                <dd>{draft.journey}</dd>
              </div>
              <div>
                <dt>Pickup</dt>
                <dd>{draft.pickup || 'Not added'}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{draft.destination || 'Not added'}</dd>
              </div>
              <div>
                <dt>When</dt>
                <dd>
                  {draft.date
                    ? `${displayDate(draft.date)}${draft.time ? ` · ${draft.time}` : ''}`
                    : 'Not added'}
                </dd>
              </div>
              <div>
                <dt>Travellers</dt>
                <dd>
                  <UsersRound size={14} aria-hidden="true" /> {draft.passengers}{' '}
                  · <BriefcaseBusiness size={14} aria-hidden="true" />{' '}
                  {draft.luggage}
                </dd>
              </div>
              <div>
                <dt>Vehicle</dt>
                <dd>{selectedVehicle?.name ?? 'No preference'}</dd>
              </div>
            </dl>
            <FareEstimate
              route={outboundRoute}
              returnRoute={returnRoute}
              quote={selectedQuote}
              vehicleName={selectedVehicle?.name ?? ''}
              origin={draft.pickup}
              destination={draft.destination}
              quoteStatus={
                routing.quoteStatus === 'loading'
                  ? 'Checking configured vehicle estimates...'
                  : undefined
              }
            />
            <p>No reservation is confirmed online.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
