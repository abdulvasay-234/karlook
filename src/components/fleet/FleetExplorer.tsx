import { useState } from 'react';
import { ArrowUpRight, UsersRound, BriefcaseBusiness } from 'lucide-react';
import { vehicleCategories, type Vehicle } from '../../data/vehicles';
import { imageAttributes } from '../../lib/images';

type DisplayVehicle = Vehicle & {
  imageUrl: string;
  detailHref: string;
  requestHref: string;
};

export default function FleetExplorer({
  vehicles,
}: {
  vehicles: DisplayVehicle[];
}) {
  const [category, setCategory] = useState('All Vehicles');
  const [selected, setSelected] = useState<string[]>([]);
  const comparison = vehicles.filter((vehicle) =>
    selected.includes(vehicle.id),
  );

  function toggleComparison(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current,
    );
  }

  return (
    <div className="fleet-explorer">
      <div className="fleet-controls">
        <div
          className="fleet-filters"
          role="group"
          aria-label="Filter vehicles by category"
        >
          {['All Vehicles', ...vehicleCategories].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <a className="compare-link" href="#compare">
          Compare vehicles <span>{selected.length}/3</span>{' '}
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
      <p className="fleet-count" aria-live="polite">
        {category === 'All Vehicles'
          ? vehicles.length
          : vehicles.filter((vehicle) => vehicle.category === category)
              .length}{' '}
        illustrative vehicles
      </p>
      <div className="collection-grid">
        {vehicles.map((vehicle) => (
          <article
            className="collection-card"
            key={vehicle.id}
            hidden={
              category !== 'All Vehicles' && category !== vehicle.category
            }
            data-reveal="up"
            data-reveal-stagger
          >
            <a
              className="collection-image"
              href={vehicle.detailHref}
              aria-label={`View ${vehicle.name}`}
            >
              <img
                {...imageAttributes(vehicle.imageUrl)}
                alt={vehicle.gallery[0]?.alt ?? `Illustrative ${vehicle.name}`}
                loading="lazy"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
              />
            </a>
            <div className="collection-info">
              <p className="collection-category">
                {vehicle.category} <span> / ILLUSTRATIVE</span>
              </p>
              <h3>{vehicle.name}</h3>
              <div className="collection-capacity">
                <span>
                  <UsersRound size={15} aria-hidden="true" />{' '}
                  {vehicle.passengers} passengers
                </span>
                <span>
                  <BriefcaseBusiness size={15} aria-hidden="true" />{' '}
                  {vehicle.luggage} bags
                </span>
              </div>
              <p className="collection-amenities">
                {vehicle.amenities.join(' · ')}
              </p>
              <div className="collection-actions">
                <a href={vehicle.detailHref}>
                  View Vehicle <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <a href={vehicle.requestHref}>
                  Request This Vehicle{' '}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
              <label className="compare-choice">
                <input
                  type="checkbox"
                  aria-label={`Compare ${vehicle.name}`}
                  checked={selected.includes(vehicle.id)}
                  disabled={
                    selected.length >= 3 && !selected.includes(vehicle.id)
                  }
                  onChange={() => toggleComparison(vehicle.id)}
                />{' '}
                Compare
              </label>
            </div>
          </article>
        ))}
      </div>
      <section
        className="comparison"
        id="compare"
        aria-labelledby="compare-heading"
      >
        <div className="comparison-heading">
          <div>
            <h2 id="compare-heading">Compare the collection.</h2>
          </div>
          <p>
            Select up to three vehicles to compare their illustrative details.
          </p>
        </div>
        <p className="comparison-status" aria-live="polite">
          {comparison.length === 0
            ? 'Choose vehicles above to begin.'
            : `${comparison.length} of 3 vehicles selected.`}
        </p>
        {comparison.length > 0 && (
          <>
            <div
              className="comparison-table-wrap"
              tabIndex={0}
              role="region"
              aria-label="Vehicle comparison table"
            >
              <table>
                <caption className="sr-only">
                  Illustrative vehicle comparison
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    {comparison.map((vehicle) => (
                      <th scope="col" key={vehicle.id}>
                        {vehicle.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Category</th>
                    {comparison.map((vehicle) => (
                      <td key={vehicle.id}>{vehicle.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Passengers</th>
                    {comparison.map((vehicle) => (
                      <td key={vehicle.id}>{vehicle.passengers}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Luggage</th>
                    {comparison.map((vehicle) => (
                      <td key={vehicle.id}>{vehicle.luggage} bags</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Amenities</th>
                    {comparison.map((vehicle) => (
                      <td key={vehicle.id}>{vehicle.amenities.join(', ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Intended use</th>
                    {comparison.map((vehicle) => (
                      <td key={vehicle.id}>
                        {vehicle.suitableJourneys.join(', ')}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="compare-clear"
              type="button"
              onClick={() => setSelected([])}
            >
              Clear comparison
            </button>
          </>
        )}
      </section>
    </div>
  );
}
