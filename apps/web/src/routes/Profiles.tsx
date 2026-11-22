import { Link, useParams } from 'react-router-dom';
import { Empty, Failure, Loading, Money, Page } from '../components/Common';
import { institutionsApi, procurementsApi, suppliersApi, type Procurement } from '../lib/api';
import { useApi } from '../lib/useApi';
function Records({ rows = [] }: { rows?: Procurement[] }) {
  return (
    <>
      <h2>Registros relacionados</h2>
      {rows.length ? (
        rows.map((x) => (
          <p key={x.id}>
            <Link to={'/contrataciones/' + x.id}>{x.identifier}</Link> ·{' '}
            {x.description || 'Sin descripción'}
          </p>
        ))
      ) : (
        <Empty text="No hay registros publicados relacionados." />
      )}
    </>
  );
}
export function Institution() {
  const { id = '' } = useParams();
  const r = useApi((s) => institutionsApi.get(id, s), [id]);
  if (r.loading)
    return (
      <Page title="Institución" description="Consultando perfil">
        <Loading />
      </Page>
    );
  if (r.error)
    return (
      <Page title="Institución" description="No disponible">
        <Failure error={r.error} retry={r.retry} />
      </Page>
    );
  const x = r.data!.data;
  return (
    <Page title={x.name} description={`${x.code} · ${x.location || 'Ubicación no disponible'}`}>
      <div className="grid">
        <div className="card metric">
          <span>Monto adjudicado comparable</span>
          <strong>
            <Money minor={x.amountMinor} currency={x.currency} />
          </strong>
        </div>
        <div className="card metric">
          <span>Registros</span>
          <strong>{x.records}</strong>
        </div>
        <div className="card metric">
          <span>Proveedores</span>
          <strong>{x.suppliers}</strong>
        </div>
      </div>
      <h2>Actividad histórica</h2>
      {x.trends?.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Moneda</th>
                <th>Monto adjudicado</th>
              </tr>
            </thead>
            <tbody>
              {x.trends.map((t, i) => (
                <tr key={i}>
                  <td>{t.period}</td>
                  <td>{t.currency}</td>
                  <td>
                    <Money minor={t.amountMinor} currency={t.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="No existe una serie histórica comparable." />
      )}
      <Records rows={x.related} />
    </Page>
  );
}
export function Supplier() {
  const { id = '' } = useParams();
  const r = useApi((s) => suppliersApi.get(id, s), [id]);
  if (r.loading)
    return (
      <Page title="Proveedor" description="Consultando perfil">
        <Loading />
      </Page>
    );
  if (r.error)
    return (
      <Page title="Proveedor" description="No disponible">
        <Failure error={r.error} retry={r.retry} />
      </Page>
    );
  const x = r.data!.data;
  return (
    <Page title={x.name} description={`RUC ${x.ruc || 'no disponible'}`}>
      <div className="danger-note">
        Los montos o adjudicaciones repetidas no prueban corrupción, pago ni entrega conforme.
      </div>
      <div className="grid">
        <div className="card metric">
          <span>Monto adjudicado comparable</span>
          <strong>
            <Money minor={x.amountMinor} currency={x.currency} />
          </strong>
        </div>
        <div className="card metric">
          <span>Registros</span>
          <strong>{x.records}</strong>
        </div>
        <div className="card metric">
          <span>Instituciones</span>
          <strong>{x.institutions}</strong>
        </div>
      </div>
      <Records rows={x.related} />
    </Page>
  );
}
export function Procurement() {
  const { id = '' } = useParams();
  const r = useApi((s) => procurementsApi.get(id, s), [id]);
  if (r.loading)
    return (
      <Page title="Contratación" description="Consultando registro">
        <Loading />
      </Page>
    );
  if (r.error)
    return (
      <Page title="Contratación" description="No disponible">
        <Failure error={r.error} retry={r.retry} />
      </Page>
    );
  const x = r.data!.data;
  return (
    <Page title={x.identifier} description={x.description || 'Sin descripción'}>
      <div className="danger-note">
        <b>Etapa registrada:</b> {x.stage}. La adjudicación, el contrato y el pago son hechos
        distintos.
      </div>
      <div className="grid">
        <Metric n="Estimado" v={x.estimatedAmountMinor} c={x.currency} />
        <Metric n="Adjudicado" v={x.awardAmountMinor} c={x.currency} />
        <Metric n="Contratado" v={x.contractAmountMinor} c={x.currency} />
        <Metric n="Pagado" v={x.paidAmountMinor} c={x.currency} />
      </div>
      <h2>Relaciones</h2>
      <p>
        Institución:{' '}
        {x.institution ? (
          <Link to={'/instituciones/' + x.institution.id}>{x.institution.name}</Link>
        ) : (
          'No disponible'
        )}
      </p>
      <p>
        Proveedor:{' '}
        {x.supplier ? (
          <Link to={'/proveedores/' + x.supplier.id}>{x.supplier.name}</Link>
        ) : (
          'No disponible'
        )}
      </p>
      <h2>Procedencia</h2>
      {x.provenance?.length ? (
        x.provenance.map((p, i) => (
          <div className="card" key={i}>
            <p>Registro fuente: {p.sourceRecordId}</p>
            <p>
              Archivo: {p.originalFilename || 'No disponible'} · Recuperado:{' '}
              {p.retrievedAt || 'No disponible'}
            </p>
            {p.sourceUrl && (
              <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                Abrir fuente oficial
              </a>
            )}
          </div>
        ))
      ) : (
        <Empty text="La procedencia detallada no está disponible." />
      )}
    </Page>
  );
}
function Metric({ n, v, c }: { n: string; v?: number | null; c?: string | null }) {
  return (
    <div className="card">
      <b>{n}</b>
      <p>
        <Money minor={v} currency={c} />
      </p>
    </div>
  );
}
