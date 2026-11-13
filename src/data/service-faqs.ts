export interface Faq {
  question: string;
  answer: string;
}

export const serviceFaqs: Record<string, Faq[]> = {
  'airport-transfers': [
    {
      question: 'Can I request a pickup from Melbourne Airport?',
      answer:
        'Airport pickup is a proposed service. Share your terminal, flight number and preferred time when enquiries open; arrangements must be confirmed.',
    },
    {
      question: 'Should I include my flight number?',
      answer:
        'Yes, you can add it to the planner for an airport journey. This does not imply flight tracking or a confirmed pickup.',
    },
    {
      question: 'What about luggage and waiting time?',
      answer:
        'Include the number of passengers and bags. Vehicle capacity and any waiting conditions must be agreed before confirmation.',
    },
  ],
  'corporate-chauffeur': [
    {
      question: 'Can I request transport for a business meeting?',
      answer:
        'You can plan a private meeting journey. Service availability and arrangements require manual confirmation.',
    },
    {
      question: 'Can colleagues travel together?',
      answer:
        'Include your party size and luggage so a suitable vehicle can be considered, subject to availability.',
    },
  ],
  'hourly-chauffeur': [
    {
      question: 'Can I include several stops?',
      answer:
        'Yes. Include your proposed stops and estimated duration when enquiries become available.',
    },
    {
      question: 'Is there a minimum number of hours?',
      answer:
        'No minimum has been published. Any conditions and a quotation would be discussed before confirmation.',
    },
  ],
  'point-to-point': [
    {
      question: 'Can I request a return journey?',
      answer:
        'You can select a return journey in the planner. Return arrangements must be confirmed when enquiries open.',
    },
    {
      question: 'Can I add a stop?',
      answer:
        'Extra stops should be included in the eventual enquiry so the route can be reviewed.',
    },
  ],
  'wedding-transportation': [
    {
      question: 'Can a wedding party travel together?',
      answer:
        'Include the group size, locations and timing in your enquiry. Suitable vehicles and availability require confirmation.',
    },
    {
      question: 'Are decorations included?',
      answer:
        'Decorations and other special requirements have not been confirmed and should be discussed in advance.',
    },
  ],
  'group-transfers': [
    {
      question: 'How do I choose a group vehicle?',
      answer:
        'Start with the number of passengers and bags. Published capacities are illustrative, not confirmed vehicle specifications.',
    },
    {
      question: 'Can I request an accessible vehicle?',
      answer:
        'Include your accessibility requirements in the enquiry; suitable arrangements have not yet been verified.',
    },
  ],
  'long-distance-transfers': [
    {
      question: 'Are regional destinations covered?',
      answer:
        'Regional service areas have not been confirmed. Share your proposed route for review once enquiries open.',
    },
    {
      question: 'How is a longer journey quoted?',
      answer:
        'A quotation would depend on the proposed route and requirements; no pricing has been published.',
    },
  ],
};
