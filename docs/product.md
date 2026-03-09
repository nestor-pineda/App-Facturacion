# Producto: Sistema de Facturación para Autónomos

Aplicación web para gestión de facturación destinada a autónomos y pequeños profesionales en España.

---

## Problema que resuelve

Los autónomos pierden tiempo valioso creando facturas manualmente en Word/Excel, gestionando la numeración correlativa, calculando IVA y manteniendo un registro organizado de clientes y servicios.

**Sistema de Facturación MVP** centraliza la creación de presupuestos y facturas, automatiza la numeración legal, calcula impuestos automáticamente y mantiene un catálogo de servicios y clientes reutilizable.

---

## Usuarios principales

### Autónomo (Usuario único)
- Gestiona su catálogo de servicios con precios
- Mantiene base de datos de clientes
- Crea presupuestos (borrador/enviado)
- Crea facturas (borrador/enviada)
- Genera números correlativos automáticos al enviar facturas
- Descarga facturas en PDF (futuro)

**No hay roles adicionales:** Cada usuario solo ve y gestiona sus propios datos.

---

## Alcance del MVP

### ✅ Lo que SÍ hace
- Crear y gestionar clientes (nombre, CIF/NIF, dirección, email)
- Crear y gestionar catálogo de servicios (nombre, precio, IVA)
- Crear presupuestos con múltiples líneas de servicios
- Crear facturas con múltiples líneas de servicios
- Calcular automáticamente subtotales, IVA y totales
- Generar numeración correlativa legal (YYYY/NNN) al enviar facturas
- Estados de documentos: borrador (editable) y enviado/enviada (inmutable)
- Sistema de snapshots: las facturas antiguas no cambian si modificas precios
- Autenticación y aislamiento total de datos por usuario

### ❌ Lo que NO es (fuera del MVP)
- No es un sistema de contabilidad completa
- No gestiona pagos ni cobros
- No envía emails automáticos
- No genera reportes fiscales avanzados
- No tiene facturación recurrente
- No soporta múltiples empresas por usuario
- No tiene clientes con acceso a portal
- No gestiona inventario o stock
- No calcula retenciones IRPF (solo IVA 21%)
- No tiene app móvil (solo web)

---

## Reglas de Negocio Críticas

### Facturas
- Una factura **borrador** puede editarse libremente
- Al marcar como **enviada**, se genera número automático y se bloquea edición
- El número es **correlativo por año**: 2026/001, 2026/002...
- Una vez enviada, la factura es **inmutable** (no se puede editar ni eliminar)
- Cada factura guarda **snapshots** de precios y descripciones al momento de crearla

### Presupuestos
- Funcionan igual que facturas pero sin numeración obligatoria
- Pueden convertirse en facturas (opcional, no en MVP)
- Al marcar como enviado, se vuelven inmutables

### IVA
- MVP solo soporta **IVA del 21%** (IVA general español)
- Todos los cálculos son automáticos

---

## Contexto Legal

### España - Facturación legal
- Las facturas deben tener **numeración única y correlativa**
- Deben incluir: CIF/NIF emisor y receptor, fecha, conceptos, base imponible, IVA, total
- Una vez emitidas, no pueden modificarse (solo rectificarse con factura rectificativa, fuera del MVP)

---

## Público Objetivo

- **Autónomos** (freelancers, consultores, diseñadores, desarrolladores)
- **Pequeños profesionales** (abogados, arquitectos, psicólogos, etc.)
- Que facturen **servicios** (no productos con inventario)
- Que necesiten **simplicidad** sobre funcionalidades avanzadas

---

## Propuesta de Valor

**"Crea facturas legales en 2 minutos, sin Excel ni dolores de cabeza"**

- ✅ Facturación legal automática (numeración correlativa)
- ✅ Sin fórmulas de Excel que romper
- ✅ Catálogo de servicios reutilizable
- ✅ Base de datos de clientes centralizada
- ✅ Cálculos de IVA automáticos
- ✅ Presupuestos profesionales

---

## Métricas de Éxito MVP

1. **Funcional:** Usuario puede crear su primera factura en menos de 5 minutos
2. **Técnico:** Sistema genera numeración correlativa sin errores
3. **UX:** Cálculos automáticos sin intervención del usuario
4. **Seguridad:** Aislamiento total de datos entre usuarios

---

## Futuras Fases (Post-MVP)

- **Fase 2:** Generación de PDFs profesionales
- **Fase 3:** Envío de facturas por email
- **Fase 4:** Dashboard con estadísticas (ingresos, facturas pendientes)
- **Fase 5:** Soporte multi-IVA (10%, 4%, exento)
- **Fase 6:** Facturas rectificativas
- **Fase 7:** Exportación a formato contable
- **Fase 8:** Recordatorios de pago automáticos

---

## Lo que el agente debe priorizar

1. **Funcionalidad básica que funcione** > Features complejas
2. **Seguridad** (aislamiento de datos) > Comodidad
3. **Cumplimiento legal** (numeración, inmutabilidad) > Flexibilidad
4. **Tests** que garanticen reglas de negocio > Cobertura al 100%
5. **Código simple y mantenible** > Arquitecturas sofisticadas
