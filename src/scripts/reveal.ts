const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const elements = Array.from(
  document.querySelectorAll<HTMLElement>('[data-reveal]'),
);

if ('IntersectionObserver' in window && !motionPreference.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );

  try {
    elements.forEach((element) => {
      if (
        element.hasAttribute('data-reveal-stagger') &&
        element.parentElement
      ) {
        const index = Array.from(element.parentElement.children).indexOf(
          element,
        );
        element.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
      }
      const bounds = element.getBoundingClientRect();
      if (bounds.top >= window.innerHeight || bounds.bottom <= 0) {
        observer.observe(element);
        element.classList.add('is-pending');
      }
    });
  } catch {
    elements.forEach((element) => element.classList.remove('is-pending'));
    observer.disconnect();
  }

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pending = target.closest('.is-pending');
    if (pending) {
      pending.classList.remove('is-pending');
      observer.unobserve(pending);
    }
  });

  motionPreference.addEventListener('change', (event) => {
    if (event.matches) {
      elements.forEach((element) => element.classList.remove('is-pending'));
      observer.disconnect();
    }
  });
}
