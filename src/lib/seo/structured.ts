import type { Service } from '../../data/services';
import { pathFor } from '../paths';
import { business, displayAddress } from '../../data/site';
import { publishedDestinations } from '../../data/destinations';

export function websiteSchema(site: URL | undefined) {
  if (!site) return [];
  const url = new URL(pathFor('/'), site).href;
  const address = business.postalAddress;
  const verified =
    business.verifiedLocalBusiness &&
    !!displayAddress() &&
    Object.values(address).every(Boolean) &&
    address.countryCode.toUpperCase() === 'AU' &&
    address.region.toUpperCase() === 'VIC' &&
    /^\d{4}$/.test(address.postcode);
  const sameAs = Object.values(business.social).filter((value) => {
    try {
      return value && new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  });
  const organisation = {
    '@context': 'https://schema.org',
    '@type': verified ? 'LocalBusiness' : 'Organization',
    '@id': `${url}#organization`,
    name: business.name,
    description: business.description,
    url,
    ...(sameAs.length ? { sameAs } : {}),
    ...(verified
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: address.streetAddress,
            addressLocality: address.locality,
            addressRegion: address.region,
            postalCode: address.postcode,
            addressCountry: address.countryCode,
          },
          ...(business.contact.phone
            ? { telephone: business.contact.phone }
            : {}),
          ...(business.contact.email ? { email: business.contact.email } : {}),
        }
      : {}),
  };
  return [
    organisation,
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${url}#website`,
      name: business.name,
      url,
      inLanguage: 'en-AU',
      publisher: { '@id': `${url}#organization` },
    },
  ];
}

export function breadcrumbSchema(
  site: URL | undefined,
  crumbs: { name: string; href: string }[],
) {
  if (!site) return [];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: new URL(pathFor(crumb.href), site).href,
      })),
    },
  ];
}

export function serviceSchema(site: URL | undefined, service: Service) {
  if (!site || !service.verified) return [];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: service.description,
      url: new URL(pathFor(`/services/${service.slug}/`), site).href,
      provider: { '@id': `${new URL(pathFor('/'), site).href}#organization` },
      ...(publishedDestinations.some(
        (destination) => destination.slug === 'melbourne',
      )
        ? { areaServed: { '@type': 'City', name: 'Melbourne' } }
        : {}),
    },
  ];
}
