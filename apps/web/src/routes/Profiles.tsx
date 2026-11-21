import { Link, useParams } from 'react-router-dom';
import { Page, DemoNotice, Money, Empty } from '../components/Common';
import { institutions, suppliers, procurements, trends } from '../data/demo';
export function Institution() {
  const { id } = useParams();
  const x = institutions.find((i) => i.id === id);
  if (!x)
    return (
      <Page
        title="Institución no encontrada"
        description="No existe un registro con ese identificador."
      >
        <Empty text="Comprueba el enlace o vuelve al explorador." />
      </Page>
    );
  const rows = procurements.filter((p) => p.institutionId === id);
  return (
    <Page title={x.name} description={`${x.code} · ${x.location}`}>
      <DemoNotice />
      <div className="grid">
        <div className="card metric">
          <span>Monto adjudicado</span>
          <strong>
            <Money value={x.amount} />
          </strong>
        </div>
        <div className="card metric">
          <span>Procedimientos</span>
          <strong>{x.records}</strong>
        </div>
        <div className="card metric">
          <span>Proveedores</span>
          <strong>{x.suppliers}</strong>
        </div>
        <div className="card">
          <span>Fuente</span>
          <strong>Fixture local sintético</strong>
        </div>
      </div>
      <h2>Actividad histórica</h2>
      <div className="chart" aria-label="Tabla visual de actividad histórica">
        {trends.map((t) => (
          <div key={t.year} className="bar" style={{ height: `${t.amount * 35}px` }}>
            {t.year}
            <br />
            {t.amount}M
          </div>
        ))}
      </div>
      <RecordLinks rows={rows} />
    </Page>
  );
}
export function Supplier() {
  const { id } = useParams();
  const x = suppliers.find((s) => s.id === id);
  if (!x)
    return (
      <Page title="Proveedor no encontrado" description="Registro inexistente">
        <Empty text="Busca otro proveedor." />
      </Page>
    );
  return (
    <Page title={x.name} description={`RUC ${x.ruc}`}>
      <DemoNotice />
      <div className="danger-note">
        <b>Cómo interpretar este perfil:</b> adjudicaciones repetidas o montos altos no prueban
        corrupción, pago ni entrega conforme.
      </div>
      <div className="grid">
        <div className="card metric">
          <span>Monto adjudicado</span>
          <strong>
            <Money value={x.amount} />
          </strong>
        </div>
        <div className="card metric">
          <span>Registros</span>
          <strong>{x.records}</strong>
        </div>
      </div>
      <RecordLinks rows={procurements.filter((p) => p.supplierId === id)} />
    </Page>
  );
}
export function Procurement() {
  const { id } = useParams();
  const x = procurements.find((p) => p.id === id);
  if (!x)
    return (
      <Page title="Contratación no encontrada" description="Registro inexistente">
        <Empty text="Vuelve a Contrataciones." />
      </Page>
    );
  const inst = institutions.find((i) => i.id === x.institutionId),
    sup = suppliers.find((s) => s.id === x.supplierId);
  return (
    <Page title={x.identifier} description={x.description}>
      <DemoNotice />
      <div className="grid">
        <div className="card">
          <b>Monto adjudicado</b>
          <p>
            <Money value={x.amount} /> ({x.currency})
          </p>
        </div>
        <div className="card">
          <b>Procedimiento</b>
          <p>{x.procedure}</p>
        </div>
        <div className="card">
          <b>Fecha</b>
          <p>{x.date}</p>
        </div>
        <div className="card">
          <b>Estado registrado</b>
          <p>{x.status}</p>
        </div>
      </div>
      <h2>Relaciones</h2>
      <p>
        Institución: <Link to={'/instituciones/' + inst?.id}>{inst?.name}</Link>
      </p>
      <p>
        Proveedor: <Link to={'/proveedores/' + sup?.id}>{sup?.name}</Link>
      </p>
      <h2>Evidencia</h2>
      <p>
        Este fixture enlaza al portal institucional solo como referencia. No afirma que exista un
        registro oficial equivalente.
      </p>
      <a className="btn" href={x.sourceUrl} target="_blank" rel="noreferrer">
        Abrir portal oficial de referencia
      </a>
    </Page>
  );
}
function RecordLinks({ rows }: { rows: typeof procurements }) {
  return (
    <>
      <h2>Contrataciones relacionadas</h2>
      {rows.length ? (
        rows.map((r) => (
          <p key={r.id}>
            <Link to={'/contrataciones/' + r.id}>{r.identifier}</Link> · {r.description}
          </p>
        ))
      ) : (
        <Empty text="No hay registros relacionados en este conjunto." />
      )}
    </>
  );
}
