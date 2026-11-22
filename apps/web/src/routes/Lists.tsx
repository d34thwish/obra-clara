import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Empty, Failure, Loading, Money, Page } from '../components/Common';
import { institutionsApi, procurementsApi, searchApi, suppliersApi } from '../lib/api';
import { useApi } from '../lib/useApi';
function Pager({
  offset,
  total,
  set,
}: {
  offset: number;
  total: number;
  set: (x: number) => void;
}) {
  return (
    <div className="filters">
      <button disabled={!offset} onClick={() => set(Math.max(0, offset - 20))}>
        Anterior
      </button>
      <span>
        {offset + 1}–{Math.min(offset + 20, total)} de {total}
      </span>
      <button disabled={offset + 20 >= total} onClick={() => set(offset + 20)}>
        Siguiente
      </button>
    </div>
  );
}
export function Search() {
  const [p] = useSearchParams(),
    q = p.get('q') || '';
  const r = useApi((s) => searchApi.list(q, s), [q]);
  return (
    <Page title="Resultados de búsqueda" description={`Resultados para “${q}”`}>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No encontramos coincidencias en los datos publicados." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Resultado</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {r.data.data.map((x) => (
                <tr key={x.type + x.id}>
                  <td>{x.type}</td>
                  <td>
                    <Link
                      to={`/${x.type === 'institution' ? 'instituciones' : x.type === 'supplier' ? 'proveedores' : 'contrataciones'}/${x.id}`}
                    >
                      {x.name}
                    </Link>
                  </td>
                  <td>{x.subtitle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
function useList(kind: 'institutions' | 'suppliers' | 'procurements') {
  const [p, setP] = useSearchParams();
  const q = p.get('q') || '',
    offset = Number(p.get('offset') || 0);
  const api =
    kind === 'institutions'
      ? institutionsApi
      : kind === 'suppliers'
        ? suppliersApi
        : procurementsApi;
  const r = useApi<any>(
    (s) => (api as any).list({ q, offset, limit: 20, stage: p.get('stage') || undefined }, s),
    [kind, q, offset, p.get('stage')],
  );
  return {
    ...r,
    q,
    offset,
    set: (v: Record<string, string>) => {
      const n = new URLSearchParams(p);
      Object.entries(v).forEach(([k, x]) => (x ? n.set(k, x) : n.delete(k)));
      setP(n);
    },
  };
}
export function Institutions() {
  const r = useList('institutions');
  return (
    <Page title="Instituciones" description="Entidades compradoras recuperadas desde la API.">
      <Filters r={r} />
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No hay instituciones publicadas." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Institución</th>
                  <th>Ubicación</th>
                  <th>Registros</th>
                  <th>Monto adjudicado</th>
                </tr>
              </thead>
              <tbody>
                {r.data.data.map((x: any) => (
                  <tr key={x.id}>
                    <td>
                      <Link to={'/instituciones/' + x.id}>{x.name}</Link>
                    </td>
                    <td>{x.location || 'No disponible'}</td>
                    <td>{x.records}</td>
                    <td>
                      <Money minor={x.amountMinor} currency={x.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            offset={r.offset}
            total={r.data.meta.total}
            set={(x) => r.set({ offset: String(x) })}
          />
        </>
      )}
    </Page>
  );
}
export function Suppliers() {
  const r = useList('suppliers');
  return (
    <Page
      title="Proveedores"
      description="RUC conservado como texto; no se fusionan nombres semejantes."
    >
      <Filters r={r} />
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No hay proveedores publicados." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>RUC</th>
                  <th>Instituciones</th>
                  <th>Monto adjudicado</th>
                </tr>
              </thead>
              <tbody>
                {r.data.data.map((x: any) => (
                  <tr key={x.id}>
                    <td>
                      <Link to={'/proveedores/' + x.id}>{x.name}</Link>
                    </td>
                    <td>{x.ruc || 'No disponible'}</td>
                    <td>{x.institutions}</td>
                    <td>
                      <Money minor={x.amountMinor} currency={x.currency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            offset={r.offset}
            total={r.data.meta.total}
            set={(x) => r.set({ offset: String(x) })}
          />
        </>
      )}
    </Page>
  );
}
export function Procurements() {
  const r = useList('procurements');
  return (
    <Page
      title="Contrataciones"
      description="Procesos, adjudicaciones, contratos, órdenes y pagos permanecen diferenciados."
    >
      <Filters r={r} stage />
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No hay registros publicados con estos filtros." />
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Identificador</th>
                  <th>Etapa</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {r.data.data.map((x: any) => (
                  <tr key={x.id}>
                    <td>
                      <Link to={'/contrataciones/' + x.id}>{x.identifier}</Link>
                    </td>
                    <td>{x.stage}</td>
                    <td>{x.description || 'No disponible'}</td>
                    <td>
                      <Money
                        minor={
                          x.awardAmountMinor ?? x.contractAmountMinor ?? x.estimatedAmountMinor
                        }
                        currency={x.currency}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            offset={r.offset}
            total={r.data.meta.total}
            set={(x) => r.set({ offset: String(x) })}
          />
        </>
      )}
    </Page>
  );
}
function Filters({ r, stage }: { r: any; stage?: boolean }) {
  const [q, setQ] = useState(r.q);
  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault();
        r.set({ q, offset: '0' });
      }}
    >
      <input
        aria-label="Filtrar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filtrar resultados"
      />
      {stage && (
        <select
          aria-label="Etapa"
          defaultValue=""
          onChange={(e) => r.set({ stage: e.target.value, offset: '0' })}
        >
          <option value="">Todas las etapas</option>
          <option value="process">Proceso</option>
          <option value="award">Adjudicación</option>
          <option value="contract">Contrato</option>
          <option value="order">Orden</option>
          <option value="payment">Pago</option>
        </select>
      )}
      <button>Aplicar</button>
    </form>
  );
}
