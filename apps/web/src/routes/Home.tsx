import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DemoNotice, Money } from '../components/Common';
import { institutions, suppliers, procurements } from '../data/demo';
export function Home() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <p>Transparencia pública, evidencia verificable</p>
          <h1>El dinero público es de todos. Su destino también debería ser transparente.</h1>
          <p>
            Explora contrataciones públicas del Perú. Descubre quién contrata, quién recibe el
            dinero y qué patrones merecen una investigación.
          </p>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              nav('/buscar?q=' + encodeURIComponent(q));
            }}
          >
            <input
              aria-label="Buscar"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca empresa, RUC, institución o contratación"
            />
            <button>Buscar</button>
          </form>
        </div>
      </section>
      <div className="container">
        <DemoNotice />
        <h2 className="section-title">Panorama de demostración</h2>
        <div className="grid">
          <div className="card metric">
            <span>Monto adjudicado</span>
            <strong>
              <Money value={institutions.reduce((s, x) => s + x.amount, 0)} />
            </strong>
            <small>Fixtures sintéticos, 2026</small>
          </div>
          <div className="card metric">
            <span>Contrataciones</span>
            <strong>{procurements.length}</strong>
            <small>Registros demo</small>
          </div>
          <div className="card metric">
            <span>Proveedores</span>
            <strong>{suppliers.length}</strong>
            <small>Identificadores ficticios</small>
          </div>
          <div className="card metric">
            <span>Instituciones</span>
            <strong>{institutions.length}</strong>
            <small>Nombres no oficiales</small>
          </div>
        </div>
        <h2 className="section-title">Empieza a explorar</h2>
        <div className="grid">
          {[
            ['/instituciones', 'Instituciones', 'Conoce quién compra y su actividad histórica.'],
            [
              '/proveedores',
              'Proveedores',
              'Revisa adjudicaciones sin inferir relaciones no documentadas.',
            ],
            ['/contrataciones', 'Contrataciones', 'Verifica montos, etapas y fuentes originales.'],
            ['/senales', 'Señales de alerta', 'Patrones estadísticos que requieren contexto.'],
          ].map((x) => (
            <Link className="card" to={x[0]} key={x[0]}>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
