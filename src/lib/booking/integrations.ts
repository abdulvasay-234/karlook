import type { BookingDraft } from './model';
import type { Place, QuoteProvider, RouteProvider } from '../routing/types';

export type AddressSuggestion = Place;
export interface AddressAutocompleteAdapter {
  search(query: string, signal: AbortSignal): Promise<AddressSuggestion[]>;
}
export type RouteAdapter = RouteProvider;
export type PricingAdapter = QuoteProvider;
export interface EnquiryRepository {
  save(booking: BookingDraft): Promise<void>;
}
export interface EmailNotificationAdapter {
  sendAcknowledgement(reference: string): Promise<void>;
  notifyOperator(reference: string): Promise<void>;
}
export interface WhatsAppBusinessAdapter {
  sendFollowUp(reference: string): Promise<void>;
}

export function whatsappHref(number: string) {
  const digits = number.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : undefined;
}

export function phoneHref(number: string) {
  const clean = number.replace(/[^+\d]/g, '');
  return clean ? `tel:${clean}` : undefined;
}
