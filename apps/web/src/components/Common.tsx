import { Link } from 'react-router-dom';
export const DemoNotice = () => (
  <div className="notice">
    <strong>Modo demostración.</strong> Los registros visibles son sintéticos, están aislados y no
    representan contrataciones reales ni acusaciones.
  </div>
);
export function Money({ value }: { value: number }) {
  return (
    <>
      {new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        maximumFractionDigits: 0,
      }).format(value)}
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
  children: any;
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
    <h3>Sin resultados verificados</h3>
    <p>{text}</p>
  </div>
);
