import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { Empty, Failure, Loading, Money, Page } from '../components/Common';
import {
  communityApi,
  datasetsApi,
  institutionsApi,
  modeApi,
  signalsApi,
  type SubmissionType,
} from '../lib/api';
import { useApi } from '../lib/useApi';
export function Explore() {
  return (
    <Page
      title="Explorar"
      description="Los filtros se aplican en el servidor y permanecen en la URL."
    >
      <p>
        <Link className="btn" to="/contrataciones">
          Abrir explorador de contrataciones
        </Link>
      </p>
    </Page>
  );
}
export function Signals() {
  const r = useApi((s) => signalsApi.list({ limit: 20, offset: 0 }, s), []);
  return (
    <Page
      title="Señales de alerta"
      description="Patrones estadísticos para revisión adicional, no acusaciones."
    >
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No existen hallazgos analíticos publicados para la cobertura actual." />
      ) : (
        r.data.data.map((x) => (
          <div className="card" key={x.id}>
            <span className="badge">
              {x.name} · v{x.version}
            </span>
            <h2>Patrón que merece revisión adicional</h2>
            <p>
              Periodo: {x.periodStart || 'No disponible'} a {x.periodEnd || 'No disponible'}
            </p>
            <pre>{JSON.stringify(x.value, null, 2)}</pre>
            <p>{String(x.methodology.notice || 'Consulta metodología y registros subyacentes.')}</p>
          </div>
        ))
      )}
    </Page>
  );
}
export function OpenData() {
  const r = useApi((s) => datasetsApi.list(s), []);
  return (
    <Page
      title="Datos abiertos"
      description="Catálogo real de las fuentes configuradas y sus importaciones."
    >
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="Todavía no hay datasets registrados en producción." />
      ) : (
        r.data.data.map((x) => (
          <div className="card" key={x.id}>
            <h2>{x.name}</h2>
            <p>
              {x.sourceInstitution} · licencia: <b>{x.licenseStatus}</b>
            </p>
            <p>
              Cobertura: {x.coverageStart || 'desconocida'} a {x.coverageEnd || 'desconocida'} ·
              registros publicados: {x.recordCount ?? 0}
            </p>
            <p>{x.limitations}</p>
            <a href={x.sourceUrl} target="_blank" rel="noreferrer">
              Fuente oficial
            </a>
          </div>
        ))
      )}
    </Page>
  );
}
export function Method() {
  return (
    <Page title="Metodología" description="Definiciones versionadas y reproducibles.">
      <h2>Concentración</h2>
      <p>
        Participación del monto adjudicado a un proveedor dentro de una entidad, moneda y periodo
        comparables. No se mezclan monedas y un valor alto no prueba irregularidad.
      </p>
      <h2>Competencia limitada</h2>
      <p>
        Solo se calcula cuando la fuente registra postores. La ausencia de datos nunca se convierte
        en cero.
      </p>
    </Page>
  );
}
const options: { value: SubmissionType; label: string }[] = [
  { value: 'feature', label: 'Propuesta de función' },
  { value: 'dataset', label: 'Conjunto de datos' },
  { value: 'indicator', label: 'Indicador' },
  { value: 'correction', label: 'Corrección' },
  { value: 'documentation', label: 'Documentación' },
  { value: 'translation', label: 'Traducción' },
  { value: 'visualization', label: 'Visualización' },
  { value: 'general', label: 'Sugerencia general' },
];
export function Community() {
  return (
    <Page
      title="Comunidad"
      description="Participa sin GitHub; los envíos son privados hasta revisión."
    >
      <div className="grid">
        {options.map((x) => (
          <Link className="card" to={'/comunidad/proponer?tipo=' + x.value} key={x.value}>
            <h3>{x.label}</h3>
            <p>Formulario estructurado y moderado.</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
const fields: Record<SubmissionType, { key: string; label: string }[]> = {
  feature: [
    { key: 'problem', label: 'Problema' },
    { key: 'users', label: 'Usuarios previstos' },
    { key: 'behavior', label: 'Comportamiento propuesto' },
    { key: 'benefit', label: 'Beneficio' },
  ],
  dataset: [
    { key: 'sourceInstitution', label: 'Institución fuente' },
    { key: 'officialUrl', label: 'URL oficial' },
    { key: 'format', label: 'Formato' },
    { key: 'frequency', label: 'Frecuencia conocida' },
    { key: 'license', label: 'Licencia conocida' },
    { key: 'usefulness', label: 'Utilidad' },
  ],
  indicator: [
    { key: 'problem', label: 'Problema' },
    { key: 'calculation', label: 'Cálculo sugerido' },
    { key: 'requiredFields', label: 'Campos requeridos' },
    { key: 'population', label: 'Población de comparación' },
    { key: 'example', label: 'Ejemplo' },
    { key: 'limitations', label: 'Limitaciones' },
  ],
  correction: [
    { key: 'recordReference', label: 'Registro afectado' },
    { key: 'problem', label: 'Qué parece incorrecto' },
    { key: 'expectedCorrection', label: 'Corrección esperada' },
    { key: 'evidence', label: 'Evidencia' },
  ],
  documentation: [
    { key: 'resource', label: 'Recurso' },
    { key: 'improvement', label: 'Mejora' },
  ],
  translation: [
    { key: 'resource', label: 'Recurso' },
    { key: 'improvement', label: 'Mejora' },
    { key: 'language', label: 'Idioma' },
  ],
  visualization: [
    { key: 'problem', label: 'Problema' },
    { key: 'behavior', label: 'Visualización propuesta' },
  ],
  general: [],
};
export function Contribute() {
  const [p] = useSearchParams(),
    initial = (p.get('tipo') || 'general') as SubmissionType;
  const [type, setType] = useState<SubmissionType>(
      options.some((x) => x.value === initial) ? initial : 'general',
    ),
    [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [details, setDetails] = useState<Record<string, string>>({}),
    [contact, setContact] = useState(''),
    [sourceUrl, setSourceUrl] = useState(''),
    [token, setToken] = useState<string>(),
    [result, setResult] = useState<string>(),
    [error, setError] = useState<string>(),
    [sending, setSending] = useState(false);
  const cfg = useApi((s) => modeApi.get(s), []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const r = await communityApi.create({
        type,
        title,
        description,
        details,
        contact,
        sourceUrl,
        turnstileToken: token,
      });
      setResult(r.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar.');
    } finally {
      setSending(false);
    }
  }
  if (result)
    return (
      <Page title="Propuesta recibida" description="El servidor confirmó la recepción.">
        <div className="card">
          <h2>{result}</h2>
          <p>Estado: recibida. Conserva este identificador.</p>
        </div>
      </Page>
    );
  return (
    <Page
      title="Enviar una propuesta"
      description="No incluyas datos personales, doxxing ni acusaciones sin sustento."
    >
      <form className="form" onSubmit={submit}>
        <label htmlFor="type">Tipo</label>
        <select
          id="type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as SubmissionType);
            setDetails({});
          }}
        >
          {options.map((x) => (
            <option value={x.value} key={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <label htmlFor="title">Título</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
        />
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={30}
          rows={5}
        />
        {fields[type].map((f) => (
          <div key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            <textarea
              id={f.key}
              value={details[f.key] || ''}
              onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <label htmlFor="source">Fuente oficial (opcional)</label>
        <input
          id="source"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
        <label htmlFor="contact">Correo de contacto privado (opcional)</label>
        <input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
        {cfg.data?.turnstileRequired &&
          (cfg.data.turnstileSiteKey ? (
            <Turnstile
              siteKey={cfg.data.turnstileSiteKey}
              options={{ action: 'community_submission' }}
              onSuccess={setToken}
              onExpire={() => setToken(undefined)}
              onError={() => setError('No se pudo cargar la verificación.')}
            />
          ) : (
            <div className="notice" role="alert">
              Turnstile no está configurado; producción rechazará el envío.
            </div>
          ))}
        {error && <p role="alert">{error}</p>}
        <button className="btn" disabled={sending || (cfg.data?.turnstileRequired && !token)}>
          {sending ? 'Enviando…' : 'Enviar a moderación'}
        </button>
      </form>
    </Page>
  );
}
export function Compare() {
  const r = useApi((s) => institutionsApi.list({ limit: 2, offset: 0 }, s), []);
  return (
    <Page title="Comparar" description="Comparación contextual, sin conclusiones automáticas.">
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.retry} />
      ) : !r.data?.data.length ? (
        <Empty text="No existen instituciones para comparar." />
      ) : (
        <div className="grid">
          {r.data.data.map((x) => (
            <div className="card" key={x.id}>
              <h3>{x.name}</h3>
              <p>
                <Money minor={x.amountMinor} currency={x.currency} />
              </p>
              <p>{x.records} registros</p>
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
export function About() {
  return (
    <Page
      title="Acerca de Obra Clara"
      description="Infraestructura cívica independiente y abierta."
    >
      <p>
        No representa al Estado peruano. No se declaran alianzas ni financiamiento en esta
        distribución.
      </p>
    </Page>
  );
}
