import { Page } from '../components/Common';
export function Admin() {
  return (
    <Page title="Moderación" description="Área protegida por Cloudflare Access.">
      <div className="grid">
        <div className="card metric">
          <span>Pendientes</span>
          <strong>0</strong>
        </div>
        <div className="card metric">
          <span>En revisión</span>
          <strong>0</strong>
        </div>
      </div>
      <p>
        Las decisiones requieren autenticación válida y se registran en moderation_events y
        audit_logs.
      </p>
    </Page>
  );
}
