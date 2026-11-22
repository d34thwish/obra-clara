import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
export const DemoNotice = () => (
  <div className="notice" role="status">
    <strong>Modo demostración.</strong> Los registros son sintéticos y no representan contrataciones
    reales.
  </div>
);
export function Money({ minor, currency }: { minor?: number | null; currency?: string | null }) {
  if (minor == null || !currency) return <>No disponible</>;
  return (
    <>
      {new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(minor / 100)}
    </>
  );
}
export const Page = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="container">
    <p className="breadcrumbs">
      <Link to="/">Inicio</Link> / {title}
    </p>
    <h1>{title}</h1>
    <p className="muted">{description}</p>
    {children}
  </div>
);
export const Empty = ({ text }: { text: string }) => (
  <div className="card">
    <h3>Sin información disponible</h3>
    <p>{text}</p>
  </div>
);
export const Loading = () => (
  <div className="card" role="status" aria-live="polite">
    Cargando información…
  </div>
);
export const Failure = ({ error, retry }: { error?: Error; retry: () => void }) => (
  <div className="card" role="alert">
    <h3>No pudimos cargar la información</h3>
    <p>{error?.message || 'Intenta nuevamente.'}</p>
    <button className="btn" onClick={retry}>
      Reintentar
    </button>
  </div>
);
