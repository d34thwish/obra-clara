export const institutions = [
  {
    id: 'inst-demo-1',
    name: 'Municipalidad Provincial Demostrativa',
    code: 'DEMO-ENT-001',
    location: 'Lima (dato sintético)',
    amount: 4850000,
    records: 42,
    suppliers: 17,
  },
  {
    id: 'inst-demo-2',
    name: 'Unidad Ejecutora de Ejemplo',
    code: 'DEMO-ENT-002',
    location: 'Cusco (dato sintético)',
    amount: 3120000,
    records: 31,
    suppliers: 14,
  },
];
export const suppliers = [
  {
    id: 'sup-demo-1',
    name: 'Servicios Andinos de Demostración S.A.C.',
    ruc: '20000000001',
    amount: 1250000,
    records: 12,
  },
  {
    id: 'sup-demo-2',
    name: 'Tecnología Cívica Demo E.I.R.L.',
    ruc: '20000000002',
    amount: 870000,
    records: 8,
  },
];
export const procurements = [
  {
    id: 'proc-demo-1',
    identifier: 'DEMO-2026-001',
    description: 'Servicio demostrativo de mantenimiento',
    institutionId: 'inst-demo-1',
    supplierId: 'sup-demo-1',
    amount: 320000,
    currency: 'PEN',
    procedure: 'Adjudicación simplificada',
    date: '2026-03-15',
    status: 'Adjudicado',
    sourceUrl: 'https://www.gob.pe/oece',
  },
  {
    id: 'proc-demo-2',
    identifier: 'DEMO-2026-002',
    description: 'Equipamiento informático de demostración',
    institutionId: 'inst-demo-2',
    supplierId: 'sup-demo-2',
    amount: 210000,
    currency: 'PEN',
    procedure: 'Licitación pública',
    date: '2026-05-21',
    status: 'Contrato registrado',
    sourceUrl: 'https://www.gob.pe/oece',
  },
];
export const trends = [
  { year: '2022', amount: 2.1 },
  { year: '2023', amount: 2.8 },
  { year: '2024', amount: 3.4 },
  { year: '2025', amount: 3.7 },
  { year: '2026', amount: 4.85 },
];
