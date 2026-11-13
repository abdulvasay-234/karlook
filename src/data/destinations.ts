import type { Faq } from './service-faqs';

export interface Destination {
  slug: string;
  name: string;
  title: string;
  description: string;
  introduction: string;
  context: string;
  heroImage: string;
  heroAlt: string;
  gallery: string[];
  active: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  fleetIds: string[];
  relatedServices: string[];
  relatedDestinations: string[];
  faqs: Faq[];
}

const additionalFaqs: Record<string, Faq> = {
  melbourne: {
    question: 'Can I include several Melbourne stops?',
    answer:
      'You can describe a multi-stop journey in the hourly planner. Availability and conditions require confirmation.',
  },
  'melbourne-cbd': {
    question: 'Can I request a journey to a CBD hotel?',
    answer:
      'Include the hotel name, street address and preferred time. Coverage and meeting arrangements remain subject to confirmation.',
  },
  'melbourne-airport': {
    question: 'Can I plan an airport drop-off?',
    answer:
      'You can enter Melbourne Airport as your destination and include your terminal and timing. The journey is not confirmed online.',
  },
  southbank: {
    question: 'Can a group travel to a Southbank venue?',
    answer:
      'Add your group size and venue address. Vehicle suitability and service availability must be confirmed.',
  },
  docklands: {
    question: 'Can I plan a corporate journey to Docklands?',
    answer:
      'Select corporate chauffeur and include the building address and timing. Arrangements are subject to review.',
  },
  'south-yarra': {
    question: 'Can I choose a vehicle for South Yarra?',
    answer:
      'You can select an illustrative vehicle preference; actual inventory and coverage have not been confirmed.',
  },
  'st-kilda': {
    question: 'Can I include luggage for a St Kilda journey?',
    answer:
      'Yes, add the number of bags and passengers to your plan. Vehicle capacity and availability remain to be confirmed.',
  },
};

export const destinations: Destination[] = [
  {
    slug: 'melbourne',
    name: 'Melbourne',
    title: 'The city, at your pace.',
    description: 'A city of distinct neighbourhoods and journeys worth taking.',
    introduction:
      'Melbourne is the starting point for the karLook experience, from its central streets to the neighbourhoods beyond.',
    context:
      'When planning a journey, share your pickup and destination addresses, preferred timing and number of travellers. Proposed service areas and availability require confirmation.',
    heroImage: '/images/melbourne-yarra.jpg',
    heroAlt: 'Melbourne skyline beside the Yarra River',
    gallery: ['/images/melbourne-yarra.jpg'],
    active: false,
    published: false,
    seoTitle: 'Chauffeur Journeys in Melbourne',
    seoDescription:
      'Explore proposed chauffeur journeys around Melbourne and plan an enquiry.',
    fleetIds: ['business-sedan', 'luxury-sedan', 'mercedes-v-class'],
    relatedServices: ['point-to-point', 'hourly-chauffeur'],
    relatedDestinations: ['melbourne-cbd', 'southbank'],
    faqs: [
      {
        question: 'Are journeys throughout Melbourne available?',
        answer:
          'Service areas have not yet been confirmed. Include the addresses in your enquiry for review.',
      },
    ],
  },
  {
    slug: 'melbourne-cbd',
    name: 'Melbourne CBD',
    title: 'The heart of Melbourne.',
    description:
      'City meetings, hotels and the rhythm of the central business district.',
    introduction:
      'Melbourne CBD brings together business addresses, hotels, theatres and the city’s distinctive laneways.',
    context:
      'For a city pickup, include the street address and any relevant entrance or timing details. Access and pickup arrangements are subject to confirmation.',
    heroImage: '/images/melbourne.jpg',
    heroAlt: 'Flinders Street Station in Melbourne CBD',
    gallery: ['/images/melbourne.jpg'],
    active: false,
    published: false,
    seoTitle: 'Melbourne CBD Chauffeur Journeys',
    seoDescription:
      'Explore proposed private chauffeur journeys to and from Melbourne CBD.',
    fleetIds: ['business-sedan', 'executive-sedan'],
    relatedServices: ['corporate-chauffeur', 'point-to-point'],
    relatedDestinations: ['southbank', 'docklands'],
    faqs: [
      {
        question: 'Where should I request a CBD pickup?',
        answer:
          'Provide your address and preferred entrance; the final meeting point must be confirmed.',
      },
    ],
  },
  {
    slug: 'melbourne-airport',
    name: 'Melbourne Airport',
    title: 'A smoother airport journey.',
    description:
      'Plan an arrival or departure through Melbourne Airport (MEL).',
    introduction:
      'Melbourne Airport serves domestic and international travellers, with multiple terminals to consider when planning a journey.',
    context:
      'Include your terminal, flight number, passenger count and luggage. Pickup arrangements, waiting conditions and service availability must be confirmed.',
    heroImage: '/images/airport.jpg',
    heroAlt: 'Aircraft at an airport terminal',
    gallery: ['/images/airport.jpg'],
    active: false,
    published: false,
    seoTitle: 'Melbourne Airport Chauffeur Transfers',
    seoDescription:
      'Plan a proposed Melbourne Airport chauffeur transfer with flight and luggage details.',
    fleetIds: ['business-sedan', 'luxury-suv', 'mercedes-v-class'],
    relatedServices: ['airport-transfers', 'group-transfers'],
    relatedDestinations: ['melbourne', 'melbourne-cbd'],
    faqs: [
      {
        question: 'Is flight tracking included?',
        answer:
          'Flight tracking has not been confirmed. You can include a flight number in the planner without assuming it will be monitored.',
      },
    ],
  },
  {
    slug: 'southbank',
    name: 'Southbank',
    title: 'By the river, in the city.',
    description: 'Arts, dining and city stays along Melbourne’s riverfront.',
    introduction:
      'Southbank sits beside the Yarra River and is known for its arts venues, dining and riverfront promenade.',
    context:
      'For hotel, restaurant or event journeys, include the venue address and preferred entrance. Service coverage and access arrangements remain unconfirmed.',
    heroImage: '/images/southbank.jpg',
    heroAlt: 'Southbank and the Yarra River in Melbourne',
    gallery: ['/images/southbank.jpg'],
    active: false,
    published: false,
    seoTitle: 'Southbank Melbourne Chauffeur Journeys',
    seoDescription:
      'Explore proposed chauffeur journeys for Southbank dining, hotels and events.',
    fleetIds: ['luxury-sedan', 'executive-sedan'],
    relatedServices: ['point-to-point', 'hourly-chauffeur'],
    relatedDestinations: ['melbourne-cbd', 'docklands'],
    faqs: [
      {
        question: 'Can I plan an event journey in Southbank?',
        answer:
          'You can include the venue and timing in a proposed enquiry. Availability requires confirmation.',
      },
    ],
  },
  {
    slug: 'docklands',
    name: 'Docklands',
    title: 'A waterfront arrival.',
    description: 'A modern waterfront district for business and events.',
    introduction:
      'Docklands is a waterfront precinct west of Melbourne’s central business district, with offices, venues and public spaces.',
    context:
      'Give the exact building or event entrance when planning a journey, particularly where a venue has several access points. Coverage has not been confirmed.',
    heroImage: '/images/docklands.jpg',
    heroAlt: 'Waterfront buildings in Melbourne Docklands',
    gallery: ['/images/docklands.jpg'],
    active: false,
    published: false,
    seoTitle: 'Docklands Melbourne Chauffeur Journeys',
    seoDescription:
      'Plan a proposed chauffeur journey to Melbourne Docklands for business or an event.',
    fleetIds: ['business-sedan', 'mercedes-v-class'],
    relatedServices: ['corporate-chauffeur', 'group-transfers'],
    relatedDestinations: ['melbourne-cbd', 'southbank'],
    faqs: [
      {
        question: 'Can I include a Docklands event venue?',
        answer:
          'Include the venue address and event time; any service and pickup arrangement must be confirmed.',
      },
    ],
  },
  {
    slug: 'south-yarra',
    name: 'South Yarra',
    title: 'A neighbourhood to linger in.',
    description:
      'A Melbourne neighbourhood of dining, shopping and leafy streets.',
    introduction:
      'South Yarra is an inner-Melbourne neighbourhood with shopping, dining and residential streets close to the city.',
    context:
      'For a day with several appointments or stops, note the addresses and estimated timing in your request. Service availability is yet to be verified.',
    heroImage: '/images/south-yarra.jpg',
    heroAlt: 'A car on a South Yarra street at night',
    gallery: ['/images/south-yarra.jpg'],
    active: false,
    published: false,
    seoTitle: 'South Yarra Chauffeur Journeys',
    seoDescription:
      'Explore proposed private chauffeur journeys around South Yarra, Melbourne.',
    fleetIds: ['luxury-sedan', 'luxury-suv'],
    relatedServices: ['hourly-chauffeur', 'wedding-transportation'],
    relatedDestinations: ['melbourne-cbd', 'st-kilda'],
    faqs: [
      {
        question: 'Can I plan several South Yarra stops?',
        answer:
          'You can describe a multi-stop itinerary for an hourly enquiry; availability and conditions need confirmation.',
      },
    ],
  },
  {
    slug: 'st-kilda',
    name: 'St Kilda',
    title: 'A different side of the city.',
    description:
      'A bayside setting for a leisurely arrival or special occasion.',
    introduction:
      'St Kilda is a Melbourne bayside neighbourhood with a foreshore, dining and cultural venues.',
    context:
      'For a bayside itinerary, provide your exact destination and any return journey details. Coverage and vehicle availability are not yet confirmed.',
    heroImage: '/images/st-kilda.jpg',
    heroAlt: 'St Kilda foreshore in Melbourne',
    gallery: ['/images/st-kilda.jpg'],
    active: false,
    published: false,
    seoTitle: 'St Kilda Chauffeur Journeys',
    seoDescription:
      'Plan a proposed chauffeur journey to St Kilda, Melbourne, subject to confirmation.',
    fleetIds: ['luxury-suv', 'premium-suv'],
    relatedServices: ['point-to-point', 'wedding-transportation'],
    relatedDestinations: ['south-yarra', 'melbourne'],
    faqs: [
      {
        question: 'Can I include a return journey from St Kilda?',
        answer:
          'A return journey can be selected in the planner; service coverage and timing need confirmation.',
      },
    ],
  },
].map((destination) => ({
  ...destination,
  faqs: [
    ...destination.faqs,
    ...(additionalFaqs[destination.slug]
      ? [additionalFaqs[destination.slug]]
      : []),
  ],
}));

export const publishedDestinations = destinations.filter(
  (destination) => destination.active && destination.published,
);
