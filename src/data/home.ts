import { publishedVehicles } from './vehicles';
import { publishedServices } from './services';
import { destinations as proposedDestinations } from './destinations';

export const fleet = publishedVehicles.slice(0, 6).map((vehicle) => ({
  slug: vehicle.slug,
  category: vehicle.category,
  name: vehicle.name,
  passengers: vehicle.passengers,
  image: vehicle.heroImage,
}));

export const services = publishedServices.slice(0, 6).map((service, index) => ({
  number: String(index + 1).padStart(2, '0'),
  title: service.title,
  slug: service.slug,
  description: service.description,
  image: service.heroImage,
}));

export const destinations = proposedDestinations.filter(
  (destination) => destination.slug !== 'melbourne',
);

export const faqs = [
  {
    question: 'How do I book a chauffeur?',
    answer:
      'Enquiries are not yet open. You can use the journey planner to prepare your details; it does not submit a request.',
  },
  {
    question: 'Do you provide Melbourne Airport transfers?',
    answer:
      'Airport transfers are a proposed service. Availability and service details will be confirmed when enquiries open.',
  },
  {
    question: 'Can I choose a specific vehicle?',
    answer:
      'The vehicles shown are illustrative. Actual fleet options and preferences will be confirmed when available.',
  },
  {
    question: 'How is the fare calculated?',
    answer:
      'Pricing has not yet been published. Any fare and inclusions will be provided before a journey is confirmed.',
  },
  {
    question: 'Can I request a return transfer?',
    answer:
      'Return journeys can be selected in the planner as a preference. Enquiries and availability are not yet open.',
  },
  {
    question: 'How do I receive booking confirmation?',
    answer:
      'Once enquiries are open, requests will require manual confirmation. The planner alone does not submit or confirm a booking.',
  },
] as const;
