import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

type Link = { label: string; href: string };

export default function MobileNav({
  links,
  bookingHref,
}: {
  links: Link[];
  bookingHref: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mobile-nav">
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={25} /> : <Menu size={25} />}
      </button>
      <div id="mobile-menu" className="mobile-drawer" hidden={!open}>
        <nav aria-label="Mobile navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a
            className="mobile-book"
            href={bookingHref}
            onClick={() => setOpen(false)}
          >
            Book now <span aria-hidden="true">&#8599;</span>
          </a>
        </nav>
      </div>
    </div>
  );
}
