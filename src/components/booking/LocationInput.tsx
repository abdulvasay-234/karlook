import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { RouteError, type Place, type RouteProvider } from '../../lib/routing/types';

interface Props {
  label: string;
  name: string;
  value: string;
  selected: Place | null;
  provider: RouteProvider | null;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
  onSelect: (place: Place) => void;
}

export default function LocationInput({ label, name, value, selected, provider, error, required, onChange, onSelect }: Props) {
  const id = useId();
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!provider || selected || value.trim().length < 3 || !open) { setResults([]); setStatus(''); return; }
    const controller = new AbortController();
    setStatus('Searching addresses...');
    const timer = window.setTimeout(async () => {
      try {
        const places = await provider.search(value, controller.signal);
        if (!controller.signal.aborted) { setResults(places); setActive(0); setStatus(places.length ? `${places.length} suggestions available.` : 'No results found.'); }
      } catch (reason) {
        if (!controller.signal.aborted) { setResults([]); setStatus(reason instanceof RouteError ? reason.message : 'Address search is unavailable.'); }
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [provider, selected, value, open]);

  function choose(place: Place) { onSelect(place); setOpen(false); setResults([]); setStatus('Address selected.'); }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); setOpen(true); setActive((current) => Math.min(current + 1, results.length - 1)); }
    if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); setActive((current) => Math.max(current - 1, 0)); }
    if (event.key === 'Enter' && open && results[active]) { event.preventDefault(); choose(results[active]); }
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); }
  }

  return <div className="wizard-field location-field"><label htmlFor={id}>{label}</label><div className="location-input-wrap"><input id={id} name={name} value={value} required={required} maxLength={300} autoComplete="off" role={provider ? 'combobox' : undefined} aria-autocomplete={provider ? 'list' : undefined} aria-expanded={provider ? open && results.length > 0 : undefined} aria-controls={provider ? `${id}-list` : undefined} aria-activedescendant={provider && open && results[active] ? `${id}-option-${active}` : undefined} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} placeholder={provider ? 'Search and select an address' : 'Enter an address'} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onChange={(event) => { onChange(event.target.value); setOpen(true); }} onKeyDown={onKeyDown} />{value && <button type="button" className="location-clear" aria-label={`Clear ${label}`} title={`Clear ${label}`} onClick={() => { onChange(''); setOpen(false); }}><X size={15} /></button>}</div>{provider && open && results.length > 0 && <ul className="location-results" id={`${id}-list`} role="listbox">{results.map((place, index) => <li key={`${place.provider}-${place.placeId}`} id={`${id}-option-${index}`} role="option" aria-selected={index === active} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(place)}>{place.formattedAddress}</li>)}</ul>}{provider && <small role="status">{status || (selected ? 'Address selected.' : 'Select a suggestion to calculate a route.')}</small>}{error && <small className="wizard-field-error" id={`${id}-error`}>{error}</small>}</div>;
}