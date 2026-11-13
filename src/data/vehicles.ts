export const vehicleCategories = [
  'Business Sedan',
  'Luxury Sedan',
  'Executive Sedan',
  'Luxury SUV',
  'Premium SUV',
  'People Mover',
  'Executive Van',
  'Coach',
] as const;

export type VehicleCategory = (typeof vehicleCategories)[number];
export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: VehicleCategory;
  description: string;
  heroImage: string;
  gallery: { src: string; alt: string }[];
  passengers: number;
  luggage: number;
  amenities: string[];
  comfortFeatures: string[];
  suitableJourneys: string[];
  published: boolean;
  demonstration: boolean;
  capacityVerified?: boolean;
  seoTitle: string;
  seoDescription: string;
}

const interior = {
  src: '/images/journey.jpg',
  alt: 'Illustrative vehicle interior, not a photograph of this model',
};

export const vehicles: Vehicle[] = [
  {
    id: 'business-sedan',
    slug: 'business-sedan',
    name: 'BMW 5 Series',
    brand: 'BMW',
    category: 'Business Sedan',
    description:
      'A composed setting for workdays, airport arrivals and the journeys in between.',
    heroImage: '/images/sedan-executive.jpg',
    gallery: [
      {
        src: '/images/sedan-executive.jpg',
        alt: 'Illustrative BMW 5 Series exterior',
      },
      interior,
    ],
    passengers: 3,
    luggage: 2,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Quiet cabin', 'Room to settle in'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Private transfers',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Business Sedan | BMW 5 Series',
    seoDescription:
      'Explore an illustrative BMW 5 Series business sedan for chauffeur journeys in Melbourne.',
  },
  {
    id: 'luxury-sedan',
    slug: 'luxury-sedan',
    name: 'Mercedes-Benz S-Class',
    brand: 'Mercedes-Benz',
    category: 'Luxury Sedan',
    description:
      'A considered space for those occasions when the journey deserves a little more.',
    heroImage: '/images/sedan-black.jpg',
    gallery: [
      {
        src: '/images/sedan-black.jpg',
        alt: 'Illustrative Mercedes-Benz S-Class exterior',
      },
      interior,
    ],
    passengers: 3,
    luggage: 2,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Spacious cabin', 'Refined interior'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Luxury Sedan | Mercedes-Benz S-Class',
    seoDescription:
      'Explore an illustrative Mercedes-Benz S-Class luxury sedan for Melbourne chauffeur journeys.',
  },
  {
    id: 'executive-sedan',
    slug: 'executive-sedan',
    name: 'BMW 7 Series',
    brand: 'BMW',
    category: 'Executive Sedan',
    description:
      'A spacious executive setting, suited to an itinerary with intention.',
    heroImage: '/images/bmw-7.jpg',
    gallery: [
      { src: '/images/bmw-7.jpg', alt: 'Illustrative BMW 7 Series exterior' },
      interior,
    ],
    passengers: 3,
    luggage: 2,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Spacious cabin', 'Room to unwind'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Executive Sedan | BMW 7 Series',
    seoDescription:
      'Explore an illustrative BMW 7 Series executive sedan for Melbourne private transfers.',
  },
  {
    id: 'luxury-suv',
    slug: 'luxury-suv',
    name: 'Range Rover',
    brand: 'Range Rover',
    category: 'Luxury SUV',
    description:
      'A confident, spacious choice for journeys around the city and beyond.',
    heroImage: '/images/suv.jpg',
    gallery: [
      { src: '/images/suv.jpg', alt: 'Illustrative Range Rover exterior' },
      interior,
    ],
    passengers: 4,
    luggage: 3,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Elevated seating', 'Generous cabin'],
    suitableJourneys: [
      'Airport transfers',
      'Private transfers',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Luxury SUV | Range Rover',
    seoDescription:
      'Explore an illustrative Range Rover luxury SUV for chauffeur journeys in Melbourne.',
  },
  {
    id: 'premium-suv',
    slug: 'premium-suv',
    name: 'BMW X7',
    brand: 'BMW',
    category: 'Premium SUV',
    description: 'A versatile choice with space to enjoy the journey together.',
    heroImage: '/images/bmw-x7.jpg',
    gallery: [
      { src: '/images/bmw-x7.jpg', alt: 'Illustrative BMW X7 exterior' },
      interior,
    ],
    passengers: 5,
    luggage: 4,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Spacious cabin', 'Flexible seating'],
    suitableJourneys: [
      'Airport transfers',
      'Private transfers',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Premium SUV | BMW X7',
    seoDescription:
      'Explore an illustrative BMW X7 premium SUV for private travel in Melbourne.',
  },
  {
    id: 'mercedes-v-class',
    slug: 'mercedes-v-class',
    name: 'Mercedes-Benz V-Class',
    brand: 'Mercedes-Benz',
    category: 'People Mover',
    description:
      'A little more room for travelling together, without compromising on comfort.',
    heroImage: '/images/v-class.jpg',
    gallery: [
      {
        src: '/images/v-class.jpg',
        alt: 'Illustrative Mercedes-Benz V-Class exterior',
      },
      { src: '/images/van.jpg', alt: 'Illustrative Mercedes-Benz van detail' },
    ],
    passengers: 6,
    luggage: 6,
    amenities: ['Climate control', 'Comfort seating'],
    comfortFeatures: ['Group seating', 'Space for luggage'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Private transfers',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'People Mover | Mercedes-Benz V-Class',
    seoDescription:
      'Explore an illustrative Mercedes-Benz V-Class people mover for group travel in Melbourne.',
  },
  {
    id: 'executive-van',
    slug: 'executive-van',
    name: 'Mercedes-Benz Sprinter',
    brand: 'Mercedes-Benz',
    category: 'Executive Van',
    description:
      'A practical, comfortable concept for a larger group travelling as one.',
    heroImage: '/images/sprinter.jpg',
    gallery: [
      {
        src: '/images/sprinter.jpg',
        alt: 'Illustrative Mercedes-Benz Sprinter exterior',
      },
    ],
    passengers: 10,
    luggage: 10,
    amenities: ['Climate control', 'Group seating'],
    comfortFeatures: ['Room for a group', 'Space for luggage'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Executive Van | Mercedes-Benz Sprinter',
    seoDescription:
      'Explore an illustrative Mercedes-Benz Sprinter executive van for Melbourne group journeys.',
  },
  {
    id: 'executive-coach',
    slug: 'executive-coach',
    name: 'Executive Coach',
    brand: 'Illustrative',
    category: 'Coach',
    description:
      'A group travel concept for larger occasions and shared itineraries.',
    heroImage: '/images/coach.jpg',
    gallery: [{ src: '/images/coach.jpg', alt: 'Illustrative coach exterior' }],
    passengers: 30,
    luggage: 30,
    amenities: ['Climate control', 'Group seating'],
    comfortFeatures: ['Group seating', 'Space for luggage'],
    suitableJourneys: [
      'Airport transfers',
      'Corporate travel',
      'Special occasions',
    ],
    published: true,
    demonstration: true,
    seoTitle: 'Executive Coach | Group Travel',
    seoDescription:
      'Explore an illustrative executive coach category for group journeys in Melbourne.',
  },
];

export const publishedVehicles = vehicles.filter(
  (vehicle) => vehicle.published,
);
