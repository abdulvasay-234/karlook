import { business } from '../../data/site';

export function seoFor(
  title: string,
  description: string,
  pathname: string,
  site?: URL,
) {
  return {
    title: title === business.name ? title : `${title} | ${business.name}`,
    description,
    canonical: site ? new URL(pathname, site).href : undefined,
  };
}
