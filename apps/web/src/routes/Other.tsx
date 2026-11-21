import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, DemoNotice, Money } from '../components/Common';
import { suppliers, institutions } from '../data/demo';
export function Explore() {
  return (
    <Page
      title="Explorar"
      description="Filtra en el servidor cuando uses datos reales; los parámetros quedan listos para URL compartibles."
    >
      <DemoNotice />
      <div className="filters">
        <select>
          <option>Departamento</option>
          <option>Lima</option>
        </select>
        <select>
          <option>Procedimiento</option>
        </select>
        <input type="date" />
        <input type="number" placeholder="Monto mínimo" />
      </div>
      <p>
        <Link className="btn" to="/contrataciones">
          Ver resultados
        </Link>
      </p>
    </Page>
  );
}
export function Signals() {
  const sup = suppliers[0],
    inst = institutions[0];
  return (
    <Page
      title="Señales de alerta"
      description="Patrones estadísticos para revisión adicional. No son acusaciones ni pruebas de corrupción."
    >
      <DemoNotice />
      <div className="danger-note">
        Las señales dependen de cobertura y comparabilidad. Siempre revisa los registros subyacentes
        y las posibles explicaciones alternativas.
      </div>
      <div className="card">
        <span className="badge">Concentración de proveedor</span>
        <h2>Patrón que merece revisión adicional</h2>
        <p>
          {sup.name} concentra una proporción elevada dentro de un conjunto sintético asociado a{' '}
          {inst.name}.
        </p>
        <p>
          <b>Periodo:</b> 2026 · <b>Muestra:</b> 12 registros · <b>Metodología:</b> monto adjudicado
          al proveedor / monto comparable.
        </p>
        <Link to="/metodologia">Entender cálculo y limitaciones</Link>
      </div>
    </Page>
  );
}
export function OpenData() {
  return (
    <Page
      title="Datos abiertos"
      description="Catálogo, procedencia, diccionarios, historial y formatos reutilizables."
    >
      <div className="card">
        <h2>Procedimientos adjudicados OECE / SEACE</h2>
        <p>
          <span className="badge">Integración verificada por documentación</span>
        </p>
        <p>
          Cobertura publicada: desde 2018. Actualización declarada: mensual. Automatización sujeta a
          URL de distribución y licencia específica.
        </p>
        <p>
          <b>Estado:</b> adaptador y ruta de importación implementados; no se incluye una descarga
          oficial en el ZIP.
        </p>
        <a href="https://www.gob.pe/14272" target="_blank" rel="noreferrer">
          Consultar fuente oficial
        </a>
      </div>
      <div className="card">
        <h2>API v1</h2>
        <p>
          Endpoints: <code>/api/v1/search</code>, <code>/api/v1/procurements</code>,{' '}
          <code>/api/v1/datasets</code> y <code>/api/openapi.json</code>.
        </p>
        <a className="btn" href="/api/openapi.json">
          Abrir OpenAPI
        </a>
      </div>
    </Page>
  );
}
export function Method() {
  return (
    <Page
      title="Metodología"
      description="Definiciones versionadas, reproducibles y abiertas a revisión."
    >
      <h2>Concentración de proveedor</h2>
      <p>
        Divide el monto adjudicado a un proveedor entre el total comparable de una institución,
        moneda y periodo. Requiere al menos cinco observaciones. Un valor alto puede reflejar
        especialización, contratos plurianuales o poca oferta local.
      </p>
      <h2>Adjudicaciones repetidas</h2>
      <p>
        Cuenta adjudicaciones del mismo proveedor por entidad y periodo. No infiere coordinación ni
        ilegalidad.
      </p>
      <h2>Competencia limitada</h2>
      <p>
        Solo se calcula cuando la fuente registra participantes. Nunca reemplaza información
        faltante por cero.
      </p>
    </Page>
  );
}
export function Community() {
  return (
    <Page title="Comunidad" description="Participa sin necesidad de saber programar.">
      <div className="grid">
        {[
          'Proponer una función',
          'Sugerir un conjunto de datos',
          'Proponer un indicador',
          'Reportar una corrección',
          'Mejorar documentación',
          'Sugerir una traducción',
        ].map((x, i) => (
          <Link className="card" key={x} to={'/comunidad/proponer?tipo=' + i}>
            <h3>{x}</h3>
            <p>Envío estructurado, privado hasta revisión.</p>
          </Link>
        ))}
      </div>
    </Page>
  );
}
export function Contribute() {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <Page
        title="Propuesta recibida"
        description="Tu envío fue guardado con un identificador estable para moderación."
      >
        <div className="card">
          <h2>OC-DEMO-{Date.now().toString().slice(-6)}</h2>
          <p>
            Estado: Recibida. En un entorno con D1, el equipo podrá revisar y registrar cada cambio.
          </p>
        </div>
      </Page>
    );
  return (
    <Page
      title="Enviar una propuesta"
      description="No publiques datos personales ni acusaciones contra personas."
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label>Tipo</label>
        <select required>
          <option>Indicador</option>
          <option>Dataset</option>
          <option>Corrección</option>
          <option>Funcionalidad</option>
        </select>
        <label>Título</label>
        <input required minLength={5} />
        <label>Problema y utilidad</label>
        <textarea required minLength={30} rows={5} />
        <label>Fuente oficial o evidencia (opcional)</label>
        <input type="url" />
        <label>Contacto (opcional, no se publica)</label>
        <input type="email" />
        <p>
          <button className="btn">Enviar a moderación</button>
        </p>
      </form>
    </Page>
  );
}
export function Compare() {
  return (
    <Page
      title="Comparar"
      description="Compara entidades similares con contexto y sin conclusiones automáticas."
    >
      <DemoNotice />
      <div className="filters">
        <select>
          <option>{institutions[0].name}</option>
        </select>
        <select>
          <option>{institutions[1].name}</option>
        </select>
      </div>
      <div className="grid">
        {institutions.map((x) => (
          <div className="card" key={x.id}>
            <h3>{x.name}</h3>
            <p>
              <Money value={x.amount} />
            </p>
            <p>{x.records} registros</p>
          </div>
        ))}
      </div>
    </Page>
  );
}
export function About() {
  return (
    <Page
      title="Acerca de Obra Clara"
      description="Infraestructura cívica abierta, independiente y verificable."
    >
      <p>
        El proyecto no representa al Estado peruano. No hay financiamiento, alianzas ni mantenedores
        institucionales declarados en esta distribución inicial.
      </p>
      <h2>Cómo rendimos cuentas</h2>
      <ul>
        <li>Código bajo AGPL-3.0-or-later.</li>
        <li>Datos oficiales conservan sus propias licencias.</li>
        <li>Metodologías y cambios quedan versionados.</li>
        <li>Las correcciones se separan del registro gubernamental original.</li>
      </ul>
    </Page>
  );
}
