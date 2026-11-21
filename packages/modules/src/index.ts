import type { ObraModule } from '@obra-clara/core';
export const dataQualityModule: ObraModule = {
  id: 'data-quality',
  name: 'Calidad de datos',
  description: 'Publica métricas de cobertura y validación sin atribuir responsabilidad.',
  version: '1.0.0',
  category: 'page',
  dependencies: [],
  capabilities: ['read:public-data-quality'],
  routes: [{ path: '/datos/calidad', label: 'Calidad de datos' }],
  enabled: true,
  dataContracts: ['DataQualitySnapshot.v1'],
};
