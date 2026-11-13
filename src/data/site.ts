interface BusinessConfig {
  name: string;
  tagline: string;
  description: string;
  country: string;
  city: string;
  currency: string;
  locale: string;
  dateFormat: string;
  distanceUnit: string;
  businessType: string;
  businessModel: string;
  bookingType: string;
  verifiedLocalBusiness: boolean;
  postalAddress: {
    streetAddress: string;
    locality: string;
    region: string;
    postcode: string;
    countryCode: string;
  };
  contact: { phone: string; email: string; whatsapp: string; address: string };
  social: { instagram: string; facebook: string; linkedin: string };
}

export const business: BusinessConfig = {
  name: 'karLook',
  tagline: 'Arrive in Style. Travel Without Compromise.',
  description:
    'Premium chauffeur services and private transfers, designed around your journey.',
  country: 'Australia',
  city: 'Melbourne',
  currency: 'AUD',
  locale: 'en-AU',
  dateFormat: 'DD/MM/YYYY',
  distanceUnit: 'kilometres',
  businessType: 'chauffeur services',
  businessModel: 'own fleet',
  bookingType: 'instant enquiry with manual confirmation',
  verifiedLocalBusiness: false,
  postalAddress: {
    streetAddress: '',
    locality: '',
    region: '',
    postcode: '',
    countryCode: '',
  },
  contact: { phone: '', email: '', whatsapp: '', address: '' },
  social: { instagram: '', facebook: '', linkedin: '' },
};

export function displayAddress() {
  const { streetAddress, locality, region, postcode, countryCode } =
    business.postalAddress;
  return business.verifiedLocalBusiness &&
    streetAddress &&
    locality &&
    region &&
    postcode &&
    countryCode
    ? `${streetAddress}, ${locality}, ${region} ${postcode}, ${countryCode}`
    : business.contact.address;
}

export const navigation = [
  { label: 'Home', href: '/' },
  { label: 'Our Fleet', href: '/fleet/' },
  { label: 'Services', href: '/services/' },
  { label: 'Destinations', href: '/destinations/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
