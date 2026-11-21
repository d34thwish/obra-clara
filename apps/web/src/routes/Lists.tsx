import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Page, DemoNotice, Money } from '../components/Common';
import { institutions, suppliers, procurements } from '../data/demo';
export function Search() {
  const [p] = useSearchParams();
  const q = (p.get('q') || '').toLowerCase();
  const results = [
    ...institutions.map((x) => ({ ...x, type: 'Institución', to: '/instituciones/' + x.id })),
    ...suppliers.map((x) => ({ ...x, type: 'Proveedor', to: '/proveedores/' + x.id })),
    ...procurements.map((x) => ({
      ...x,
      name: x.identifier,
      type: 'Contratación',
      to: '/contrataciones/' + x.id,
    })),
  ].filter((x) => x.name.toLowerCase().includes(q) || JSON.stringify(x).toLowerCase().includes(q));
  return (
    <Page title="Resultados de búsqueda" description={`Resultados para “${p.get('q') || ''}”`}>
      <DemoNotice />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {results.map((x: any) => (
              <tr key={x.to}>
                <td>{x.type}</td>
                <td>
                  <Link to={x.to}>{x.name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
function Filter({ on }: { on: (x: string) => void }) {
  return (
    <div className="filters">
      <input placeholder="Filtrar resultados" onChange={(e) => on(e.target.value)} />
      <select aria-label="Año">
        <option>2026</option>
        <option>Todos los años</option>
      </select>
    </div>
  );
}
export function Institutions() {
  const [q, setQ] = useState('');
  const rows = useMemo(
    () => institutions.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  return (
    <Page
      title="Instituciones"
      description="Actividad de entidades compradoras, con periodo, cobertura y procedencia visibles."
    >
      <DemoNotice />
      <Filter on={setQ} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Institución</th>
              <th>Ubicación</th>
              <th>Monto</th>
              <th>Registros</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <Link to={'/instituciones/' + x.id}>{x.name}</Link>
                </td>
                <td>{x.location}</td>
                <td>
                  <Money value={x.amount} />
                </td>
                <td>{x.records}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
export function Suppliers() {
  const [q, setQ] = useState('');
  const rows = suppliers.filter((x) => (x.name + x.ruc).toLowerCase().includes(q.toLowerCase()));
  return (
    <Page
      title="Proveedores"
      description="Perfiles separados por RUC. Los montos adjudicados no equivalen a pagos."
    >
      <DemoNotice />
      <Filter on={setQ} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>RUC</th>
              <th>Monto adjudicado</th>
              <th>Registros</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <Link to={'/proveedores/' + x.id}>{x.name}</Link>
                </td>
                <td>{x.ruc}</td>
                <td>
                  <Money value={x.amount} />
                </td>
                <td>{x.records}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
export function Procurements() {
  const [q, setQ] = useState('');
  const rows = procurements.filter((x) =>
    JSON.stringify(x).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Page
      title="Contrataciones"
      description="Procesos, adjudicaciones y contratos conservan sus etapas y valores diferenciados."
    >
      <DemoNotice />
      <Filter on={setQ} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Descripción</th>
              <th>Fecha</th>
              <th>Monto adjudicado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <Link to={'/contrataciones/' + x.id}>{x.identifier}</Link>
                </td>
                <td>{x.description}</td>
                <td>{x.date}</td>
                <td>
                  <Money value={x.amount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
