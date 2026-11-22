# Registro de fuentes de contratación pública

**Revisión documental:** 2026-11-21  
**Alcance:** metadatos publicados en la Plataforma Nacional de Datos Abiertos, portal del OECE y portal del MEF.  
**Estado:** investigación de escritorio; no se descargaron, importaron ni publicaron registros oficiales en esta revisión.

## Regla de interpretación

La licencia debe evaluarse por cada registro de dataset, no por el organismo ni por el portal completo. `License Not Specified` no equivale a una licencia abierta. `Other (Open)` tampoco identifica por sí sola un instrumento de licencia concreto. Hasta obtener una aclaración escrita o un texto de licencia aplicable, Obra Clara no redistribuirá esos datos ni publicará derivados que dependan de ellos.

La existencia de una consulta pública tampoco prueba que una descarga masiva, el almacenamiento de copias o la redistribución estén autorizados. Cuando la licencia no esté clara, el producto puede enlazar a la fuente oficial sin copiar sus registros.

## Registro de fuentes

| Fuente                                                         | Contenido descrito por el publicador                                                                                                                                                                          | Licencia del catálogo                                                                                | Decisión actual                                                                                                                                                                             |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OECE — Datos de la Convocatoria o Invitación                   | Convocatorias/invitaciones de procedimientos adjudicados desde 2018; no incluye procesos en marcha, nulos, desiertos o cancelados. El monto referencial/estimado pertenece a la etapa de proceso.             | License Not Specified                                                                                | Mantener el adaptador en dry-run. No publicar originales ni derivados.                                                                                                                      |
| OECE — Datos de la Adjudicación                                | Buena pro, postor ganador, valor adjudicado y fechas.                                                                                                                                                         | License Not Specified                                                                                | Fuente prioritaria para solicitar aclaración de licencia; no importar a producción.                                                                                                         |
| OECE — Contratos de las entidades                              | Contratos registrados por las entidades para procedimientos adjudicados convocados desde 2018.                                                                                                                | License Not Specified                                                                                | No importar ni unir hasta aclarar licencia y confirmar claves.                                                                                                                              |
| OECE — Proveedores y Consorcios                                | Detalles de proveedores adjudicados, razón social, ubigeo y datos del RNP.                                                                                                                                    | License Not Specified                                                                                | No confundir con el registro de catálogo separado llamado “Proveedores adjudicados”. No importar aún.                                                                                       |
| OECE — Entidades Contratantes                                  | Tabla maestra de entidades públicas contratantes con registro activo en SEACE.                                                                                                                                | License Not Specified                                                                                | Candidata para normalización de entidades, condicionada a aclaración de licencia y revisión del diccionario.                                                                                |
| OECE — Listado de ofertantes                                   | Recurso XLSX con diccionario y metadatos publicados.                                                                                                                                                          | Open Data Commons Attribution License                                                                | Candidata preferida para un primer adaptador limitado a participación/competencia, tras inspeccionar el diccionario y el archivo real. Aplicar atribución y conservar procedencia.          |
| OECE — Proveedores adjudicados (registro de catálogo separado) | Dataset distinto de “Proveedores y Consorcios”; el catálogo muestra licencia Open Data Commons Attribution License.                                                                                           | Open Data Commons Attribution License                                                                | Candidato de investigación. Antes de integrar, verificar recurso vigente, cobertura, definición y campos; no asumir que equivale al dataset actual de Proveedores y Consorcios.             |
| MEF — Presupuesto y Ejecución de Gasto                         | Archivos CSV 2012–2026 derivados de Consulta Amigable; los recursos recientes incluyen PIA, PIM y fases de ejecución como compromiso, devengado y girado, agregadas por unidades ejecutoras y clasificadores. | Other (Open)                                                                                         | Candidato para contexto presupuestario institucional. La ficha no nombra una licencia concreta; aclarar términos antes de redistribuir. No presentarlo como pago de un contrato individual. |
| MEF — Consulta de Proveedores del Estado                       | El MEF describe una base de proveedores que contrataron con el Estado desde 1999 hasta el ejercicio actual, actualizada diariamente.                                                                          | No se verificó una ficha de licencia ni un recurso de descarga masiva reutilizable en esta revisión. | Investigar acceso, campos, condiciones y granularidad. No extraer ni republicar mediante scraping.                                                                                          |

## Qué sabemos y qué todavía no sabemos sobre las uniones

Los catálogos y descripciones establecen que las fuentes tratan partes relacionadas del ciclo de contratación. No bastan, por sí solos, para demostrar que las claves técnicas coincidan.

Antes de unir registros, inspeccionar los diccionarios y datos reales para verificar:

1. **Convocatoria ↔ adjudicación:** identificar el código de procedimiento/convocatoria compartido, su formato, unicidad y cobertura. No asumir que el identificador usado por el adaptador de convocatoria es la clave de todos los datasets.
2. **Adjudicación ↔ ofertantes/proveedor:** confirmar la clave del procedimiento, identificador de ítem/lote, RUC, tratamiento de persona natural y representación de consorcios. No emparejar solo por nombre comercial.
3. **Adjudicación ↔ contrato:** confirmar el identificador de procedimiento y, si existe, el identificador único de contrato; medir relaciones uno-a-varios, varios-a-uno y contratos modificados.
4. **Entidad OECE ↔ unidad ejecutora MEF:** verificar el identificador oficial y si la relación es uno-a-uno o uno-a-varios. Una entidad contratante puede no corresponder directamente a una sola unidad ejecutora presupuestal.
5. **Contrato ↔ gasto/pago:** la ejecución presupuestal agregada por unidad ejecutora y clasificador no demuestra cuánto se pagó por un contrato particular. Para atribuir un pago a un contrato se requiere un registro transaccional con una clave de enlace verificable (o evidencia documental equivalente).

No realizar joins difusos o inferidos en producción. Toda relación debe guardar la fuente, la clave utilizada, la versión de la regla y su nivel de confianza. Una ausencia de coincidencia debe permanecer como “sin enlace verificado”, no rellenarse por conjetura.

## Secuencia recomendada

### Paso A — completar la inspección de datos

- Descargar desde las páginas oficiales el XLSX y diccionario del Listado de ofertantes.
- Inspeccionar encabezados, tipos, identificadores, cobertura temporal, duplicados y relaciones entre hojas.
- Obtener el recurso y diccionario exactos de “Proveedores adjudicados” y verificar que el archivo esté vigente.
- Solicitar al OECE confirmación escrita de las condiciones de reutilización de adjudicaciones, contratos, convocatorias, entidades y proveedores/consorcios.
- Revisar la descripción legal concreta asociada a `Other (Open)` para los archivos del MEF.
- Investigar la consulta MEF de proveedores sin asumir que permite descarga o redistribución.

### Paso B — primer piloto

Si el archivo y el diccionario confirman lo esperado, implementar primero un adaptador del **Listado de ofertantes** bajo ODC Attribution. El piloto debe limitarse a campos y métricas que el dataset realmente soporte, por ejemplo número de participantes por procedimiento si la clave y las filas lo permiten. No derivar “ganador” ni “valor adjudicado” desde una lista de ofertantes.

### Paso C — ciclo completo de contratación

Solo después de obtener claridad de licencia y validar las claves, integrar adjudicaciones y contratos. Mantener separados los importes estimados, adjudicados y contratados. El gasto MEF debe mostrarse como contexto presupuestario por unidad ejecutora y periodo, a menos que aparezca una fuente oficial que conecte pagos a contratos de forma directa y verificable.

## Fuentes oficiales consultadas

- [Portal de Datos Abiertos del OECE (CONOSCE)](https://bi.seace.gob.pe/pentaho/api/repos/%3Apublic%3Aportal%3Adatosabiertos.html/content?password=key&userid=public)
- [Datos de la Convocatoria o Invitación — OECE](https://www.datosabiertos.gob.pe/dataset/datos-de-la-convocatoria-o-invitaci%C3%B3n-de-las-entidades-organismo-especializado-para-las)
- [Datos de la Adjudicación — OECE](https://www.datosabiertos.gob.pe/dataset/datos-de-la-adjudicaci%C3%B3n-organismo-especializado-para-las-contrataciones-p%C3%BAblicas-eficientes)
- [Contratos de las entidades — OECE](https://www.datosabiertos.gob.pe/dataset/contratos-de-las-entidades-organismo-especializado-para-las-contrataciones-p%C3%BAblicas)
- [Proveedores y Consorcios — OECE](https://www.datosabiertos.gob.pe/dataset/proveedores-y-consorcios-organismo-especializado-para-las-contrataciones-p%C3%BAblicas-eficientes)
- [Entidades Contratantes — OECE](https://www.datosabiertos.gob.pe/dataset/entidades-contratantes-organismo-especializado-para-las-contrataciones-p%C3%BAblicas-eficientes)
- [Listado de ofertantes — OECE](https://www.datosabiertos.gob.pe/dataset/listado-de-ofertantes-%E2%80%93-organismo-especializado-para-las-contrataciones-p%C3%BAblicas-eficientes)
- [Proveedores adjudicados — OECE](https://www.datosabiertos.gob.pe/dataset/proveedores-adjudicados-organismo-especializado-para-las-contrataciones-p%C3%BAblicas-eficientes)
- [Presupuesto y Ejecución de Gasto — MEF](https://www.datosabiertos.gob.pe/dataset/presupuesto-y-ejecuci%C3%B3n-de-gasto)
- [Consulta de Proveedores del Estado — MEF](https://www.mef.gob.pe/es/provedores-del-estado/que-es-y-como-muestra-la-consulta)
- [Portal de Transparencia Económica — MEF](https://www.mef.gob.pe/es/portal-de-transparencia-economica)
- [Servicio oficial de acceso al Portal de Datos Abiertos del OECE](https://www.gob.pe/14272-acceder-al-portal-de-datos-abiertos-del-oece)

## Limitaciones de esta revisión

Las páginas de catálogo fueron consultadas, pero algunas descargas y diccionarios no pudieron inspeccionarse directamente durante esta revisión. Por tanto, este documento **no afirma que los campos de unión estén verificados** ni que se haya realizado una importación. La siguiente tarea de datos debe comenzar con la descarga e inspección controlada de los recursos licenciados y la solicitud de aclaraciones al OECE/MEF.
