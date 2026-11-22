import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { es } from '../i18n/es';
import { DemoNotice } from './Common';
import { modeApi } from '../lib/api';
import { useApi } from '../lib/useApi';
export function Layout() {
  const [open, setOpen] = useState(false);
  const cfg = useApi((signal) => modeApi.get(signal), []);
  const links = [
    ['/', es.nav.home],
    ['/explorar', es.nav.explore],
    ['/instituciones', es.nav.institutions],
    ['/proveedores', es.nav.suppliers],
    ['/contrataciones', es.nav.procurements],
    ['/senales', es.nav.signals],
    ['/datos', es.nav.data],
    ['/comunidad', es.nav.community],
    ['/metodologia', es.nav.method],
  ];
  return (
    <>
      <a className="skip" href="#contenido">
        Saltar al contenido
      </a>
      <header className="header">
        <div className="head-inner">
          <Link className="brand" to="/">
            OBRA <i>CLARA</i>
          </Link>
          <button className="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            Menú
          </button>
          <nav className={`nav ${open ? 'open' : ''}`} aria-label="Principal">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido">
        {cfg.data?.mode === 'demo' && <DemoNotice />}
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <b>OBRA CLARA</b>
            <p>
              Proyecto cívico independiente y de código abierto. No es una autoridad gubernamental.
            </p>
          </div>
          <div>
            <Link to="/acerca">Transparencia del proyecto</Link>
            <br />
            <Link to="/metodologia">Metodología</Link>
          </div>
          <div>
            <Link to="/datos">Datos abiertos</Link>
            <br />
            <Link to="/comunidad">Participa</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
