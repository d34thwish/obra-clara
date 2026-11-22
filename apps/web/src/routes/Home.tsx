import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Failure, Loading, Money } from '../components/Common';
import { modeApi } from '../lib/api';
import { useApi } from '../lib/useApi';
export function Home() {
  const [q, setQ] = useState(''),
    nav = useNavigate();
  const stats = useApi((s) => modeApi.overview(s), []);
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p>Transparencia pública, evidencia verificable</p>
          <h1>El dinero público es de todos. Su destino también debería ser transparente.</h1>
          <p>Explora contrataciones públicas del Perú, sus fuentes y los límites de cobertura.</p>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) nav('/buscar?q=' + encodeURIComponent(q.trim()));
            }}
          >
            <input
              aria-label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Empresa, RUC, institución o contratación"
            />
            <button>Buscar</button>
          </form>
        </div>
      </section>
      <div className="container">
        {stats.loading ? (
          <Loading />
        ) : stats.error ? (
          <Failure error={stats.error} retry={stats.retry} />
        ) : (
          <>
            <h2>
              Panorama{' '}
              {stats.data?.meta.mode === 'demo' ? 'de demostración' : 'de datos publicados'}
            </h2>
            <div className="grid">
              <div className="card metric">
                <span>Monto comparable</span>
                <strong>
                  <Money
                    minor={stats.data?.data.amountMinor}
                    currency={stats.data?.data.currency}
                  />
                </strong>
                <small>Solo se suma una moneda compatible.</small>
              </div>
              <div className="card metric">
                <span>Contrataciones</span>
                <strong>{stats.data?.data.procurements ?? 0}</strong>
              </div>
              <div className="card metric">
                <span>Proveedores</span>
                <strong>{stats.data?.data.suppliers ?? 0}</strong>
              </div>
              <div className="card metric">
                <span>Instituciones</span>
                <strong>{stats.data?.data.institutions ?? 0}</strong>
              </div>
            </div>
            {stats.data?.meta.mode === 'production' && stats.data.data.procurements === 0 && (
              <div className="notice">
                Aún no hay datos oficiales publicados. La plataforma no sustituye esta ausencia con
                estadísticas sintéticas.
              </div>
            )}
          </>
        )}
        <h2>Empieza a explorar</h2>
        <div className="grid">
          {[
            ['/instituciones', 'Instituciones'],
            ['/proveedores', 'Proveedores'],
            ['/contrataciones', 'Contrataciones'],
            ['/senales', 'Señales de alerta'],
          ].map((x) => (
            <Link className="card" to={x[0]} key={x[0]}>
              <h3>{x[1]}</h3>
              <p>Consulta registros, contexto y procedencia.</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
