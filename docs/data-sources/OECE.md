# OECE

El catálogo oficial consultado el 2026-11-21 declara que “Datos de la Convocatoria o Invitación” contiene convocatorias/invitaciones de procedimientos adjudicados desde 2018 y excluye procesos en marcha, nulos, desiertos o cancelados. El registro describe una **convocatoria**, por lo que el adaptador genera etapa `process`: monto referencial/estimado nunca se transforma en monto adjudicado.

El catálogo también lista fuentes separadas para Datos de la Adjudicación, Contratos, Proveedores y Consorcios, Entidades Contratantes y Listado de ofertantes. Esta distribución no afirma integraciones de esas fuentes hasta revisar diccionarios, claves y licencias. El catálogo de convocatoria y el de proveedores indican `License Not Specified`; el pipeline permite dry-run pero bloquea promoción.
