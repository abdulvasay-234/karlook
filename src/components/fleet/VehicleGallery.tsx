import { useRef, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import { imageAttributes } from '../../lib/images';

type Image = { src: string; alt: string };
export default function VehicleGallery({ images }: { images: Image[] }) {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);

  function open(index: number) {
    setActive(index);
    dialog.current?.showModal();
  }
  function move(direction: number) {
    setActive(
      (current) => (current + direction + images.length) % images.length,
    );
  }
  function handleKey(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.current?.close();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  }

  return (
    <>
      <div className="vehicle-gallery">
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image.src}-${index}`}
            onClick={() => open(index)}
            aria-label={`Open image ${index + 1}: ${image.alt}`}
          >
            <img
              {...imageAttributes(image.src)}
              alt={image.alt}
              loading="lazy"
              sizes="(max-width: 600px) 100vw, 50vw"
            />
            <span>
              <Expand size={18} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label="Vehicle image gallery"
        onKeyDown={handleKey}
      >
        <div className="gallery-dialog-top">
          <span>
            ILLUSTRATIVE IMAGE {active + 1} / {images.length}
          </span>
          <button
            type="button"
            aria-label="Close gallery"
            title="Close gallery"
            onClick={() => dialog.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        <div className="gallery-view">
          <button
            type="button"
            aria-label="Previous image"
            title="Previous image"
            disabled={images.length < 2}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={25} />
          </button>
          <img
            {...imageAttributes(images[active]?.src ?? '')}
            alt={images[active]?.alt ?? ''}
            sizes="100vw"
            loading="lazy"
          />
          <button
            type="button"
            aria-label="Next image"
            title="Next image"
            disabled={images.length < 2}
            onClick={() => move(1)}
          >
            <ChevronRight size={25} />
          </button>
        </div>
        <p>{images[active]?.alt}</p>
      </dialog>
    </>
  );
}
