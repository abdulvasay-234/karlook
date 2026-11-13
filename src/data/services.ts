export interface Service {
  slug: string;
  title: string;
  headline: string;
  description: string;
  introduction: string;
  details: string[];
  features: string[];
  steps: string[];
  heroImage: string;
  heroAlt: string;
  gallery: string[];
  published: boolean;
  verified: boolean;
  seoTitle: string;
  seoDescription: string;
  fleetIds: string[];
  relatedServices: string[];
  relatedDestinations: string[];
  journeyType: 'Airport Transfer' | 'Point-to-Point' | 'Hourly Chauffeur';
}

export const services: Service[] = [
  {
    slug: 'airport-transfers',
    title: 'Melbourne Airport Transfers',
    headline: 'A calmer way to arrive.',
    description: 'Considered journeys to and from Melbourne Airport (MEL).',
    introduction:
      'The journey to or from the airport deserves the same attention as the trip itself.',
    details: [
      'Share whether you are travelling to or from Melbourne Airport, along with your flight number and preferred pickup time. This helps frame the request; flight monitoring and pickup arrangements are not yet confirmed.',
      'Include your passenger and luggage counts so that an appropriate vehicle can be considered. Terminal details, meeting arrangements and any waiting conditions should be agreed when the enquiry is confirmed.',
    ],
    features: [
      'Airport pickup or drop-off',
      'Passenger and luggage planning',
      'Flight details included in your request',
    ],
    steps: [
      'Choose an airport transfer and enter your route.',
      'Add your flight number, pickup time and party size.',
      'Submit your enquiry when bookings open and await manual confirmation.',
    ],
    heroImage: '/images/airport.jpg',
    heroAlt: 'Aircraft at Melbourne Airport',
    gallery: ['/images/airport.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Melbourne Airport Transfers',
    seoDescription:
      'Plan an illustrative chauffeur transfer to or from Melbourne Airport, including flight and luggage details.',
    fleetIds: ['business-sedan', 'luxury-suv', 'mercedes-v-class'],
    relatedServices: ['point-to-point', 'group-transfers'],
    relatedDestinations: ['melbourne-airport', 'melbourne-cbd'],
    journeyType: 'Airport Transfer',
  },
  {
    slug: 'corporate-chauffeur',
    title: 'Corporate Chauffeur',
    headline: 'A considered business day.',
    description: 'Executive journeys shaped around the demands of your day.',
    introduction:
      'A little more space to prepare, connect or simply pause between commitments.',
    details: [
      'From a private journey to a meeting to travel around a business event, describe your itinerary and the people travelling with you.',
      'For a day with several appointments, include the likely stops and timing in your enquiry. Vehicle preferences and arrangements are subject to confirmation.',
    ],
    features: [
      'Private business journeys',
      'Meetings and event itineraries',
      'Vehicle preferences for your party',
    ],
    steps: [
      'Outline your business itinerary and timing.',
      'Choose an illustrative vehicle preference.',
      'Request the journey and await manual confirmation.',
    ],
    heroImage: '/images/sedan-black.jpg',
    heroAlt: 'Illustrative executive sedan for business travel',
    gallery: ['/images/sedan-black.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Corporate Chauffeur Melbourne',
    seoDescription:
      'Explore proposed corporate chauffeur journeys for Melbourne meetings, events and private business travel.',
    fleetIds: ['business-sedan', 'executive-sedan', 'mercedes-v-class'],
    relatedServices: ['hourly-chauffeur', 'point-to-point'],
    relatedDestinations: ['melbourne-cbd', 'docklands'],
    journeyType: 'Point-to-Point',
  },
  {
    slug: 'hourly-chauffeur',
    title: 'Hourly Chauffeur Hire',
    headline: 'Time, on your terms.',
    description:
      'A flexible journey request for days with more than one destination.',
    introduction:
      'Some days do not follow a single route. Plan a journey around the time and stops you have in mind.',
    details: [
      'Tell us your preferred start time, estimated duration and the places on your itinerary. Business appointments, a day of leisure or several personal stops can be described in one request.',
      'A quotation and any applicable conditions would need to be agreed before confirmation. No hourly rate or minimum duration is published here.',
    ],
    features: [
      'Duration-based journey requests',
      'Multiple destinations',
      'Business or leisure itineraries',
    ],
    steps: [
      'Select hourly chauffeur and your preferred start time.',
      'Include your estimated duration and proposed stops.',
      'Request a custom quotation when enquiries open.',
    ],
    heroImage: '/images/journey.jpg',
    heroAlt: 'Illustrative view from inside a car',
    gallery: ['/images/journey.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Hourly Chauffeur Hire Melbourne',
    seoDescription:
      'Plan an hourly chauffeur enquiry in Melbourne with multiple stops and an estimated duration.',
    fleetIds: ['luxury-sedan', 'executive-sedan', 'luxury-suv'],
    relatedServices: ['corporate-chauffeur', 'point-to-point'],
    relatedDestinations: ['melbourne', 'south-yarra'],
    journeyType: 'Hourly Chauffeur',
  },
  {
    slug: 'point-to-point',
    title: 'Point-to-Point Transfers',
    headline: 'From here to where matters.',
    description: 'A direct private journey between the places on your day.',
    introduction:
      'Whether the next stop is a meeting, a dinner or home, begin with a clear route.',
    details: [
      'Provide the pickup location, destination and desired time. If your plans include extra stops or a return journey, include those details with the request.',
      'The right vehicle depends on the number of travellers, luggage and the route. Every request remains subject to manual confirmation.',
    ],
    features: [
      'A clearly defined route',
      'Private journey preferences',
      'Return journeys can be requested',
    ],
    steps: [
      'Enter your pickup and destination.',
      'Add your preferred time and passenger details.',
      'Send the request when enquiries open.',
    ],
    heroImage: '/images/sedan-executive.jpg',
    heroAlt: 'Illustrative sedan on an urban road',
    gallery: ['/images/sedan-executive.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Point-to-Point Chauffeur Transfers Melbourne',
    seoDescription:
      'Plan a proposed private point-to-point chauffeur transfer around Melbourne.',
    fleetIds: ['business-sedan', 'luxury-sedan', 'premium-suv'],
    relatedServices: ['airport-transfers', 'hourly-chauffeur'],
    relatedDestinations: ['southbank', 'st-kilda'],
    journeyType: 'Point-to-Point',
  },
  {
    slug: 'wedding-transportation',
    title: 'Wedding Transportation',
    headline: 'Arrive in your own time.',
    description: 'Thoughtful travel for the moments surrounding a special day.',
    introduction:
      'A wedding day is made of many arrivals. Give each journey the attention it deserves.',
    details: [
      'Share the ceremony and reception locations, the timing of each journey and who needs to travel. Separate journeys or a group vehicle can be discussed in the enquiry.',
      'Vehicle choices, decorations, scheduling and any special requirements must be agreed in advance; no wedding package is assumed.',
    ],
    features: [
      'Ceremony and reception journeys',
      'Individual or group travel planning',
      'A schedule shaped around your day',
    ],
    steps: [
      'Outline the date, locations and travelling party.',
      'Share your timing and vehicle preferences.',
      'Discuss the arrangements before manual confirmation.',
    ],
    heroImage: '/images/sedan-silver.jpg',
    heroAlt: 'Illustrative sedan for a special occasion',
    gallery: ['/images/sedan-silver.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Wedding Chauffeur Transportation Melbourne',
    seoDescription:
      'Explore proposed wedding transport enquiries for Melbourne ceremonies and receptions.',
    fleetIds: ['luxury-sedan', 'executive-sedan', 'mercedes-v-class'],
    relatedServices: ['hourly-chauffeur', 'group-transfers'],
    relatedDestinations: ['south-yarra', 'st-kilda'],
    journeyType: 'Point-to-Point',
  },
  {
    slug: 'group-transfers',
    title: 'Group Transfers',
    headline: 'The journey is better together.',
    description:
      'Thoughtful planning for a group travelling in the same direction.',
    introduction:
      'Make room for the people, luggage and details that come with travelling together.',
    details: [
      'Tell us the number of passengers, luggage and any pickup or drop-off points. The illustrative people mover, van and coach categories provide a starting point for discussion.',
      'Actual vehicle capacity, accessibility requirements and availability must be confirmed for each group. Multiple vehicles may be considered where appropriate.',
    ],
    features: [
      'Passenger and luggage planning',
      'People mover, van and coach examples',
      'Event and airport journey requests',
    ],
    steps: [
      'Share the group size and route.',
      'Include luggage and any accessibility requirements.',
      'Await confirmation of a suitable arrangement.',
    ],
    heroImage: '/images/v-class.jpg',
    heroAlt: 'Illustrative Mercedes-Benz people mover exterior',
    gallery: ['/images/v-class.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Group Chauffeur Transfers Melbourne',
    seoDescription:
      'Plan an illustrative group transfer enquiry in Melbourne for airport, business or event travel.',
    fleetIds: ['mercedes-v-class', 'executive-van', 'executive-coach'],
    relatedServices: ['airport-transfers', 'wedding-transportation'],
    relatedDestinations: ['melbourne-airport', 'southbank'],
    journeyType: 'Point-to-Point',
  },
  {
    slug: 'long-distance-transfers',
    title: 'Long-Distance Transfers',
    headline: 'The long way, considered.',
    description: 'A more personal approach to journeys beyond the city.',
    introduction:
      'For a journey that extends beyond the everyday, begin with the route and the time you need.',
    details: [
      'Include your departure and destination, preferred timing and any stops you would like to discuss. Longer journeys may need additional planning for passengers and luggage.',
      'Routes, service areas, costs and any driver breaks or other conditions must be agreed before confirmation. Regional coverage is not yet confirmed.',
    ],
    features: [
      'Longer route planning',
      'Stops discussed in advance',
      'A quotation tailored to the itinerary',
    ],
    steps: [
      'Describe the full route and preferred date.',
      'Include stops, passengers and luggage.',
      'Request a quotation and await confirmation.',
    ],
    heroImage: '/images/suv.jpg',
    heroAlt: 'Illustrative SUV for a longer journey',
    gallery: ['/images/suv.jpg'],
    published: true,
    verified: false,
    seoTitle: 'Long-Distance Chauffeur Transfers Melbourne',
    seoDescription:
      'Explore proposed long-distance chauffeur enquiries from Melbourne, subject to route confirmation.',
    fleetIds: ['luxury-suv', 'premium-suv', 'mercedes-v-class'],
    relatedServices: ['point-to-point', 'hourly-chauffeur'],
    relatedDestinations: ['melbourne'],
    journeyType: 'Point-to-Point',
  },
];

export const publishedServices = services.filter(
  (service) => service.published,
);
