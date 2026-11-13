# karLook SEO Audit

Audit snapshot: 14 November 2026. Scope: the static Astro output, with a synthetic HTTPS origin and `/karlook/` base path used only for testing. The domain has not been purchased and the test origin is not a production recommendation.

## Findings and changes

| Finding                                                                            | Disposition                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Pages origin could become the canonical URL before a domain was configured. | Preview builds now omit canonicals and use `noindex, nofollow`; GitHub Pages and development origins are rejected as production origins.                                |
| No sitemap or sitemap reference existed.                                           | Astro now generates an XML sitemap from generated routes and a base-aware robots file when a production origin is configured.                                           |
| Illustrative vehicle pages and placeholder booking/legal pages could be indexed.   | Illustrative vehicles, booking, confirmation, legal placeholders and 404 are noindex and excluded from the sitemap. Unconfirmed destination details remain unpublished. |
| Booking shells lacked an H1 before React hydration.                                | The static loading shell now has a single descriptive H1.                                                                                                               |
| Images lacked intrinsic dimensions and served full JPEGs to mobile screens.        | Responsive WebP variants, `srcset`, `sizes`, intrinsic dimensions, lazy loading and high-priority hero loading are in place. Original JPEGs remain as sources.          |
| External font CSS blocked rendering.                                               | Manrope and Playfair Display are self-hosted with `font-display: swap`.                                                                                                 |
| FAQ detail page had only placeholder copy.                                         | It now includes the existing factual booking FAQs.                                                                                                                      |
| Site-level entity and some breadcrumb metadata were absent.                        | Organization, WebSite and BreadcrumbList JSON-LD are emitted when a real origin is configured. LocalBusiness and Service markup remain gated by verified data.          |

The initial generated-route audit found no duplicate titles or descriptions, broken internal links or invalid JSON-LD. The expanded automated audit checks 27 generated HTML pages, internal discoverability of indexable pages, base-aware canonicals, sitemap membership, robots directives, social metadata, headings and image references. At this snapshot, 14 pages are indexable in a configured-domain test build; the remaining 13 are deliberately noindex. No indexing is enabled by default without a configured production domain.

## Keyword Mapping

| Primary intent                      | Page                                 | Supporting themes                                     |
| ----------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| Luxury chauffeur Melbourne          | `/`                                  | Brand and premium private travel                      |
| Chauffeur service Melbourne         | `/services/`                         | Overview of proposed chauffeur services               |
| Melbourne airport chauffeur         | `/services/airport-transfers/`       | Melbourne airport transfers                           |
| Corporate chauffeur Melbourne       | `/services/corporate-chauffeur/`     | Executive car service Melbourne                       |
| Private chauffeur Melbourne         | `/services/point-to-point/`          | Private point-to-point journeys                       |
| Hourly chauffeur Melbourne          | `/services/hourly-chauffeur/`        | Multi-stop and duration-based requests                |
| Group chauffeur transfers Melbourne | `/services/group-transfers/`         | Group and airport journey planning                    |
| Wedding transport enquiries         | `/services/wedding-transportation/`  | Ceremony and reception journeys                       |
| Long-distance chauffeur enquiries   | `/services/long-distance-transfers/` | Proposed longer routes                                |
| Chauffeur vehicle categories        | `/fleet/`                            | Illustrative collection, not verified inventory       |
| Melbourne chauffeur service areas   | `/destinations/`                     | Proposed areas only; individual pages are unpublished |

Search intent is assigned to one principal page per theme. The location templates must not be published until useful local information and actual coverage have been verified; they are not a licence to create repetitive pages. GEO improvements make the information easier to understand but do not guarantee AI citations or rankings.

## Performance Snapshot

Local Lighthouse 13.6.0, headless Chrome, simulated mobile throttling, one run per page against the production preview on 14 November 2026:

| Page              | Performance |   FCP |   LCP |   CLS | Total blocking time |
| ----------------- | ----------: | ----: | ----: | ----: | ------------------: |
| Home              |          92 | 0.9 s | 3.3 s |     0 |                0 ms |
| Fleet             |          91 | 0.9 s | 3.5 s | 0.001 |                0 ms |
| Airport transfers |          96 | 0.9 s | 2.9 s | 0.001 |                0 ms |
| Booking           |          96 | 0.9 s | 2.7 s |     0 |               10 ms |

LCP remains above the 2.5 s good threshold in these lab runs and should be investigated on the real host and network. These are local lab results, not field Core Web Vitals. Lighthouse does not supply a representative real-user INP from this navigation; measure INP, LCP and CLS with real-user monitoring or Search Console/CrUX after launch and sufficient traffic. Repeat several runs before comparing changes.

The original homepage hero is 381,585 bytes; its generated 640px and 1280px WebP variants are 29,104 and 92,362 bytes respectively. Fonts and imagery are served locally. The current optional booking and route services make network requests only when explicitly configured; no analytics or Google Fonts runtime dependency is included by default. Review image licences and use approved brand photography before launch.

## Launch Checklist

1. Purchase and verify the custom domain. Configure GitHub Pages DNS and HTTPS, set `PUBLIC_SITE_URL` to the verified HTTPS origin and `ASTRO_BASE` to `/`, then redeploy. Do not use the GitHub preview origin as a canonical.
2. Verify service availability, fleet details, contact channels and each proposed destination. Publish only verified destination records; replace placeholder privacy and terms pages before accepting enquiries.
3. For an eligible real business, configure one Google Business Profile using verified details. Do not create separate profiles for service areas or claim verification automatically.
4. Verify a Search Console domain property through DNS, or use a URL-prefix property with the issued `PUBLIC_GOOGLE_SITE_VERIFICATION` token. Use `PUBLIC_BING_SITE_VERIFICATION` for a Bing meta token if required. These are public build-time values, not credentials.
5. Submit the production `/sitemap-index.xml` in Search Console and Bing Webmaster Tools. Use URL Inspection on the home page and representative service pages; a sitemap entry does not imply indexing.
6. Check structured data using Google's Rich Results Test and Schema Markup Validator. Organization and breadcrumb markup do not guarantee rich results; never add unsupported FAQ or product markup.
7. Monitor indexing, crawl errors, canonical selection, mobile usability and Core Web Vitals. Confirm the host-root `robots.txt` is reachable after custom-domain cutover; a project-site subpath cannot control the shared GitHub Pages host-root robots file.
