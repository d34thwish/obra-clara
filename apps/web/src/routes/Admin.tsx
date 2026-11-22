import { useState } from 'react';
import { adminApi, type AdminSubmission } from '../lib/api';
import { useApi } from '../lib/useApi';
import { Empty, Failure, Loading, Page } from '../components/Common';
export function Admin() {
  const [status, setStatus] = useState(''),
    [selected, setSelected] = useState<AdminSubmission>(),
    [notes, setNotes] = useState(''),
    [next, setNext] = useState('under_review');
  const r = useApi((s) => adminApi.list({ status, limit: 50, offset: 0 }, s), [status]);
  async function open(id: string) {
    try {
      setSelected((await adminApi.get(id)).data);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }
  async function update() {
    if (!selected) return;
    try {
      await adminApi.update(selected.id, { status: next, notes });
      setSelected((await adminApi.get(selected.id)).data);
      setNotes('');
      r.retry();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }
  return (
    <Page
      title="Moderación"
      description="Área protegida por Cloudflare Access y allowlist de moderadores."
    >
      <div className="filters">
        <label>
          Estado{' '}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {[
              'received',
              'under_review',
              'needs_information',
              'accepted',
              'rejected',
              'implemented',
              'closed',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No hay envíos con este filtro." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {r.data.data.map((x) => (
                <tr key={x.id}>
                  <td>
                    <button onClick={() => open(x.id)}>{x.id}</button>
                  </td>
                  <td>{x.type}</td>
                  <td>{x.title}</td>
                  <td>{x.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && (
        <section className="card">
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <pre>{JSON.stringify(selected.details, null, 2)}</pre>
          <p>
            <b>Contacto privado:</b> {selected.contactEmail || 'No proporcionado'}
          </p>
          <h3>Historial</h3>
          {selected.history?.map((x) => (
            <p key={x.id}>
              {x.createdAt}: {x.fromStatus} → {x.toStatus} por {x.actor}. {x.notes}
            </p>
          ))}
          <label>
            Nuevo estado{' '}
            <select value={next} onChange={(e) => setNext(e.target.value)}>
              {[
                'under_review',
                'needs_information',
                'accepted',
                'rejected',
                'implemented',
                'closed',
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Nota interna
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <button className="btn" onClick={update}>
            Registrar decisión
          </button>
        </section>
      )}
    </Page>
  );
}
