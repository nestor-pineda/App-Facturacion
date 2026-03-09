# Design Doc: Generación de PDFs On-Demand para Facturas y Presupuestos

## Estado
[ ] Borrador | [ ] En revisión | [ ] Aprobado | [X] Implementado

**Fecha de creación:** 2026-03-06  
**Autor:** Sistema de Facturación MVP  
**Relacionado con:** Fase 6 del roadmap (decisions.md)

---

## ⚠️ IMPORTANTE: Consideraciones de desarrollo

### Metodología TDD estricta
Este documento está diseñado para ser implementado siguiendo **Test-Driven Development (TDD)**:
- ✅ SIEMPRE escribir tests ANTES de escribir código de producción
- ✅ Verificar que los tests FALLAN antes de implementar
- ✅ Implementar solo el código mínimo necesario para pasar los tests
- ✅ Refactorizar manteniendo los tests en verde
- ❌ NUNCA modificar tests para que el código pase
- 🛑 DETENER si un test falla después de implementar y reportar el problema

### Estados del sistema
El sistema maneja únicamente **DOS estados** para documentos:
- **`borrador`**: Editable, sin número asignado (facturas), puede eliminarse
- **`enviada`** (facturas) / **`enviado`** (presupuestos): Inmutable, con número asignado (facturas), NO se puede editar ni eliminar

**Para PDFs:**
- ✅ Facturas: Solo se pueden descargar en estado `enviada`
- ✅ Presupuestos: Se pueden descargar en ambos estados (`borrador` y `enviado`)

---

## Problema

Los autónomos necesitan **descargar sus facturas y presupuestos en formato PDF** para:
- Enviar a clientes por email
- Presentar a la administración fiscal
- Mantener archivo documental legal
- Imprimir copias físicas

**Actualmente:** El sistema solo almacena datos en PostgreSQL. No hay forma de obtener documentos imprimibles.

**Requisito legal:** En España, las facturas deben poder entregarse en formato legible y duradero (PDF cumple este requisito).

---

## Contexto

### Decisiones arquitectónicas previas (ver decisions.md)

**Nota:** Este sistema maneja únicamente **dos estados** para documentos:
- `borrador`: Documento editable, sin número asignado (facturas), puede eliminarse
- `enviada` (facturas) / `enviado` (presupuestos): Documento inmutable, con número asignado (facturas), no se puede editar ni eliminar

1. **[2026-02-26] PDF generado en backend, no en frontend**
   - Razón: Consistencia, seguridad, validación server-side
   - Tecnología elegida: **Puppeteer** (HTML → PDF)

2. **[2026-02-26] Sin caché en MVP**
   - Los PDFs se generan **on-demand** (bajo petición)
   - No se almacenan en disco ni en S3
   - Rationale: Evitar complejidad de storage y sincronización

### Requisitos funcionales

- ✅ Generar PDF de **Facturas** (solo estado `enviada`, no `borrador`)
- ✅ Generar PDF de **Presupuestos** (ambos estados: `borrador` y `enviado`)
- ✅ El PDF debe incluir:
  - Datos del emisor (autónomo): nombre_comercial, NIF, dirección_fiscal
  - Datos del receptor (cliente): nombre, CIF/NIF, dirección
  - Número de documento (para facturas) o etiqueta "PRESUPUESTO"
  - Fecha de emisión
  - Tabla de líneas con: descripción, cantidad, precio unitario, subtotal
  - Desglose de IVA por tipo (en MVP solo 21%)
  - Totales: Subtotal, Total IVA, Total
  - Notas (si existen)
- ✅ Respuesta HTTP directa (stream de bytes, no archivo guardado)
- ✅ Validación de permisos: solo el propietario puede descargar sus documentos

### Requisitos no funcionales

- **Tiempo de generación:** < 5 segundos por documento
- **Tamaño del PDF:** < 500KB (documentos típicos con 1-10 líneas)
- **Concurrencia:** Soportar 10 generaciones simultáneas sin degradación
- **Seguridad:** Verificar `user_id` antes de generar PDF

---

## Solución propuesta

### Stack técnico

- **Librería:** Puppeteer 21.x
- **Motor de templates:** Template literals (TypeScript nativo)
- **Formato de salida:** PDF/A-1b (estándar de archivo)
- **Fuentes:** System fonts (Arial, Helvetica) para compatibilidad

### Arquitectura de capas

```
┌─────────────────────────────────────────────────────────┐
│  HTTP Request: GET /invoices/:id/pdf                    │
│                Authorization: Bearer <token>             │
└─────────────────────────────┬───────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  pdf.routes.ts     │
                    │  (Routing layer)   │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ pdf.controller.ts  │
                    │ - Validar params   │
                    │ - Orquestar flujo  │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────────┐    │    ┌─────────▼─────────┐
    │ invoice.service   │    │    │  pdf.service.ts   │
    │ - getById()       │    │    │  - generate()     │
    │ - Verificar owner │    │    │  - renderTemplate │
    └───────────────────┘    │    └───────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Puppeteer       │
                    │  HTML → PDF      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Response        │
                    │  Content-Type:   │
                    │  application/pdf │
                    └──────────────────┘
```

### Estructura de archivos (nuevos)

```
src/
├── services/
│   └── pdf.service.ts                 # Lógica de generación PDF
│
├── templates/
│   ├── invoice.template.ts            # Template HTML factura
│   ├── quote.template.ts              # Template HTML presupuesto
│   ├── styles/
│   │   └── document.styles.ts         # CSS común para ambos
│   └── utils/
│       └── formatters.ts              # Helpers de formato (€, fechas)
│
├── routes/
│   └── pdf.routes.ts                  # GET /invoices/:id/pdf
│                                      # GET /quotes/:id/pdf
│
├── controllers/
│   └── pdf.controller.ts              # Orquestación del flujo
│
└── types/
    └── pdf.types.ts                   # Tipos para datos del template
```

### Flujo de datos detallado

```typescript
// 1. Request llega al controlador
GET /api/v1/invoices/abc-123/pdf
Headers: { Authorization: "Bearer eyJ..." }

// 2. Controller valida y obtiene datos
const userId = req.user.userId;  // Desde JWT
const invoiceId = req.params.id;

// 3. Obtener datos completos de la factura
const invoice = await invoiceService.getById(userId, invoiceId);
// Esto ya verifica ownership internamente

// 4. Transformar a estructura para template
const templateData = {
  tipo: 'factura',
  numero: invoice.numero,
  fecha: invoice.fecha_emision,
  emisor: {
    nombre: invoice.user.nombre_comercial,
    nif: invoice.user.nif,
    direccion: invoice.user.direccion_fiscal,
    telefono: invoice.user.telefono
  },
  cliente: {
    nombre: invoice.client.nombre,
    cif: invoice.client.cif_nif,
    direccion: invoice.client.direccion,
    email: invoice.client.email
  },
  lineas: invoice.lines.map(line => ({
    descripcion: line.descripcion,
    cantidad: line.cantidad,
    precioUnitario: line.precio_unitario,
    ivaPorcentaje: line.iva_porcentaje,
    subtotal: line.subtotal
  })),
  totales: {
    subtotal: invoice.subtotal,
    totalIva: invoice.total_iva,
    total: invoice.total
  },
  notas: invoice.notas
};

// 5. Generar HTML
const html = renderInvoiceTemplate(templateData);

// 6. Puppeteer: HTML → PDF
const pdfBuffer = await pdfService.generatePDF(html);

// 7. Enviar respuesta
res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.numero}.pdf"`);
res.send(pdfBuffer);
```

### Implementación del servicio PDF

```typescript
// src/services/pdf.service.ts
import puppeteer from 'puppeteer';

interface GeneratePDFOptions {
  html: string;
  filename?: string;
}

export const generatePDF = async (
  html: string
): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Para entornos con poca memoria
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Configurar viewport para renderizado consistente
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Cargar HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0' // Esperar a que cargue todo
    });
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    return pdf;
  } finally {
    await browser.close(); // CRÍTICO: Siempre cerrar browser
  }
};
```

### Template HTML (estructura base)

```typescript
// src/templates/invoice.template.ts
import { formatCurrency, formatDate } from './utils/formatters';
import { documentStyles } from './styles/document.styles';

interface InvoiceTemplateData {
  tipo: 'factura';
  numero: string;
  fecha: Date;
  emisor: {
    nombre: string;
    nif: string;
    direccion: string;
    telefono?: string;
  };
  cliente: {
    nombre: string;
    cif: string;
    direccion: string;
    email: string;
  };
  lineas: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    ivaPorcentaje: number;
    subtotal: number;
  }>;
  totales: {
    subtotal: number;
    totalIva: number;
    total: number;
  };
  notas?: string;
}

export const renderInvoiceTemplate = (data: InvoiceTemplateData): string => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    ${documentStyles}
  </style>
</head>
<body>
  <div class="document">
    <!-- Header -->
    <div class="header">
      <div class="document-title">
        <h1>FACTURA</h1>
        <p class="document-number">${data.numero}</p>
      </div>
      <div class="document-date">
        <p>Fecha: ${formatDate(data.fecha)}</p>
      </div>
    </div>

    <!-- Emisor y Cliente -->
    <div class="parties">
      <div class="party">
        <h3>Emisor</h3>
        <p><strong>${data.emisor.nombre}</strong></p>
        <p>NIF: ${data.emisor.nif}</p>
        <p>${data.emisor.direccion}</p>
        ${data.emisor.telefono ? `<p>Tel: ${data.emisor.telefono}</p>` : ''}
      </div>
      
      <div class="party">
        <h3>Cliente</h3>
        <p><strong>${data.cliente.nombre}</strong></p>
        <p>CIF/NIF: ${data.cliente.cif}</p>
        <p>${data.cliente.direccion}</p>
        <p>${data.cliente.email}</p>
      </div>
    </div>

    <!-- Tabla de líneas -->
    <table class="lines-table">
      <thead>
        <tr>
          <th class="text-left">Descripción</th>
          <th class="text-center">Cantidad</th>
          <th class="text-right">Precio Unit.</th>
          <th class="text-right">IVA</th>
          <th class="text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${data.lineas.map(line => `
          <tr>
            <td>${line.descripcion}</td>
            <td class="text-center">${line.cantidad}</td>
            <td class="text-right">${formatCurrency(line.precioUnitario)}</td>
            <td class="text-right">${line.ivaPorcentaje}%</td>
            <td class="text-right">${formatCurrency(line.subtotal)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totales -->
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal (Base Imponible):</span>
        <span>${formatCurrency(data.totales.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>IVA (21%):</span>
        <span>${formatCurrency(data.totales.totalIva)}</span>
      </div>
      <div class="totals-row total-final">
        <span><strong>TOTAL:</strong></span>
        <span><strong>${formatCurrency(data.totales.total)}</strong></span>
      </div>
    </div>

    <!-- Notas -->
    ${data.notas ? `
      <div class="notes">
        <h4>Notas:</h4>
        <p>${data.notas}</p>
      </div>
    ` : ''}

    <!-- Footer legal -->
    <div class="footer">
      <p class="legal-text">
        Factura sujeta a IVA. Documento generado electrónicamente.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
```

### Estilos CSS compartidos

```typescript
// src/templates/styles/document.styles.ts
export const documentStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12pt;
    color: #333;
    line-height: 1.6;
  }

  .document {
    padding: 20mm;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 3px solid #2c3e50;
  }

  .document-title h1 {
    font-size: 28pt;
    color: #2c3e50;
    margin-bottom: 5px;
  }

  .document-number {
    font-size: 16pt;
    color: #7f8c8d;
    font-weight: 600;
  }

  .document-date {
    text-align: right;
    font-size: 11pt;
    color: #555;
  }

  .parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
  }

  .party {
    width: 48%;
  }

  .party h3 {
    font-size: 12pt;
    color: #2c3e50;
    margin-bottom: 10px;
    text-transform: uppercase;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 5px;
  }

  .party p {
    font-size: 11pt;
    margin-bottom: 5px;
  }

  .lines-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
  }

  .lines-table thead {
    background-color: #34495e;
    color: white;
  }

  .lines-table th,
  .lines-table td {
    padding: 12px 10px;
    border: 1px solid #ddd;
  }

  .lines-table th {
    font-weight: 600;
    font-size: 11pt;
  }

  .lines-table td {
    font-size: 11pt;
  }

  .lines-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }

  .totals {
    margin-left: auto;
    width: 350px;
    border-top: 2px solid #2c3e50;
    padding-top: 15px;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 12pt;
  }

  .total-final {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 2px solid #2c3e50;
    font-size: 14pt;
    color: #2c3e50;
  }

  .notes {
    margin-top: 30px;
    padding: 15px;
    background-color: #f8f9fa;
    border-left: 4px solid #3498db;
  }

  .notes h4 {
    font-size: 11pt;
    margin-bottom: 8px;
    color: #2c3e50;
  }

  .notes p {
    font-size: 10pt;
    color: #555;
    white-space: pre-wrap;
  }

  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }

  .legal-text {
    font-size: 9pt;
    color: #999;
    text-align: center;
  }

  /* Print-specific */
  @media print {
    .document {
      padding: 0;
    }
  }
`;
```

### Utilidades de formateo

```typescript
// src/templates/utils/formatters.ts

/**
 * Formatea un número como moneda española (€)
 */
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

/**
 * Formatea una fecha al formato español (DD/MM/YYYY)
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
};
```

### Controlador

```typescript
// src/controllers/pdf.controller.ts
import { Request, Response } from 'express';
import * as invoiceService from '../services/invoice.service';
import * as quoteService from '../services/quote.service';
import * as pdfService from '../services/pdf.service';
import { renderInvoiceTemplate } from '../templates/invoice.template';
import { renderQuoteTemplate } from '../templates/quote.template';

export const generateInvoicePDF = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const invoiceId = req.params.id;

  try {
    // 1. Obtener factura (ya verifica ownership)
    const invoice = await invoiceService.getById(userId, invoiceId);
    
    // 2. Validar estado (solo facturas enviadas, no borradores)
    if (invoice.estado === 'borrador') {
      return res.status(422).json({
        success: false,
        error: {
          message: 'No se pueden descargar facturas en estado borrador. Envía la factura primero.',
          code: 'INVOICE_DRAFT'
        }
      });
    }

    // 3. Transformar datos para template
    const templateData = mapInvoiceToTemplateData(invoice);

    // 4. Generar HTML
    const html = renderInvoiceTemplate(templateData);

    // 5. Generar PDF
    const pdfBuffer = await pdfService.generatePDF(html);

    // 6. Enviar respuesta
    const filename = `factura-${invoice.numero.replace('/', '-')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF de factura:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al generar PDF',
        code: 'PDF_GENERATION_ERROR'
      }
    });
  }
};

export const generateQuotePDF = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const quoteId = req.params.id;

  try {
    const quote = await quoteService.getById(userId, quoteId);
    
    const templateData = mapQuoteToTemplateData(quote);
    const html = renderQuoteTemplate(templateData);
    const pdfBuffer = await pdfService.generatePDF(html);

    const filename = quote.numero 
      ? `presupuesto-${quote.numero.replace('/', '-')}.pdf`
      : `presupuesto-${quoteId.slice(0, 8)}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generando PDF de presupuesto:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al generar PDF',
        code: 'PDF_GENERATION_ERROR'
      }
    });
  }
};

// Helper para mapear datos
const mapInvoiceToTemplateData = (invoice: any) => {
  return {
    tipo: 'factura' as const,
    numero: invoice.numero,
    fecha: invoice.fecha_emision,
    emisor: {
      nombre: invoice.user.nombre_comercial,
      nif: invoice.user.nif,
      direccion: invoice.user.direccion_fiscal,
      telefono: invoice.user.telefono
    },
    cliente: {
      nombre: invoice.client.nombre,
      cif: invoice.client.cif_nif,
      direccion: invoice.client.direccion,
      email: invoice.client.email
    },
    lineas: invoice.lines.map((line: any) => ({
      descripcion: line.descripcion,
      cantidad: Number(line.cantidad),
      precioUnitario: Number(line.precio_unitario),
      ivaPorcentaje: Number(line.iva_porcentaje),
      subtotal: Number(line.subtotal)
    })),
    totales: {
      subtotal: Number(invoice.subtotal),
      totalIva: Number(invoice.total_iva),
      total: Number(invoice.total)
    },
    notas: invoice.notas
  };
};

const mapQuoteToTemplateData = (quote: any) => {
  // Similar a mapInvoiceToTemplateData pero sin numero obligatorio
  return { /* ... */ };
};
```

### Rutas

```typescript
// src/routes/pdf.routes.ts
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as pdfController from '../controllers/pdf.controller';

const router = Router();

/**
 * @route   GET /api/v1/invoices/:id/pdf
 * @desc    Genera y descarga PDF de una factura
 * @access  Private (requiere autenticación)
 * @param   id - UUID de la factura
 * @returns PDF file (application/pdf)
 */
router.get('/invoices/:id/pdf', authenticate, pdfController.generateInvoicePDF);

/**
 * @route   GET /api/v1/quotes/:id/pdf
 * @desc    Genera y descarga PDF de un presupuesto
 * @access  Private (requiere autenticación)
 * @param   id - UUID del presupuesto
 * @returns PDF file (application/pdf)
 */
router.get('/quotes/:id/pdf', authenticate, pdfController.generateQuotePDF);

export default router;
```

### Tipos TypeScript

```typescript
// src/types/pdf.types.ts

export interface DocumentParty {
  nombre: string;
  nif: string;
  direccion: string;
  telefono?: string;
  email?: string;
}

export interface DocumentLine {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface DocumentTotals {
  subtotal: number;
  totalIva: number;
  total: number;
}

export interface InvoiceTemplateData {
  tipo: 'factura';
  numero: string;
  fecha: Date;
  emisor: DocumentParty;
  cliente: Omit<DocumentParty, 'telefono'> & { email: string };
  lineas: DocumentLine[];
  totales: DocumentTotals;
  notas?: string;
}

export interface QuoteTemplateData {
  tipo: 'presupuesto';
  numero?: string;
  fecha: Date;
  emisor: DocumentParty;
  cliente: Omit<DocumentParty, 'telefono'> & { email: string };
  lineas: DocumentLine[];
  totales: DocumentTotals;
  notas?: string;
}

export type DocumentTemplateData = InvoiceTemplateData | QuoteTemplateData;
```

---

## Alternativas descartadas

### 1. PDFKit (generación programática)

**Descartada porque:**
- API imperativa más verbosa (más líneas de código)
- Diseño visual más difícil de mantener
- Sin preview del resultado durante desarrollo
- Curva de aprendizaje diferente a HTML/CSS

**Ejemplo del código que evitamos:**
```typescript
doc.fontSize(20).text('FACTURA', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text(`Número: ${invoice.numero}`);
doc.moveDown();
doc.text('Emisor:', { underline: true });
doc.text(invoice.user.nombre_comercial);
// ... 50 líneas más de posicionamiento manual
```

### 2. Frontend generation (jsPDF, react-pdf)

**Descartada porque:**
- Inconsistencias entre navegadores
- Sin validación de permisos server-side
- Cliente puede manipular el HTML antes de generar
- No cumple con arquitectura "PDF en backend" (decisions.md)

### 3. Servicios externos (DocRaptor, PDFShift)

**Descartada porque:**
- Costos recurrentes por cada PDF ($0.01-0.05 por documento)
- Dependencia externa (si caen, nuestra app no funciona)
- Privacidad: datos de facturas salen de nuestro servidor
- Latencia adicional de red

### 4. Almacenar PDFs en S3/Storage

**Descartada porque:**
- Complejidad de sincronización (¿qué pasa si editas borrador?)
- Costos de storage crecientes
- Necesidad de invalidar cache al editar
- MVP no requiere historial de versiones de PDF
- Arquitectura "sin caché en MVP" (decisions.md)

---

## Trade-offs

### ✅ Beneficios

1. **Consistencia visual:** Todos los PDFs lucen idénticos
2. **Seguridad:** Validación server-side antes de generar
3. **Mantenibilidad:** Templates HTML fáciles de modificar
4. **Sin costos externos:** Solo compute del servidor
5. **Control total:** Podemos customizar cada detalle
6. **Legal compliance:** Cumple requisitos de facturación española

### ⚠️ Desventajas aceptadas

1. **Consumo de recursos:** Puppeteer consume ~100-200MB RAM por proceso
   - **Mitigación:** Se libera automáticamente al cerrar browser
   - **Aceptable porque:** Generación on-demand, no masiva

2. **Tiempo de generación:** 2-5 segundos por PDF
   - **Mitigación:** Mostrar spinner en frontend
   - **Aceptable porque:** Operación ocasional (1-2 veces por factura)

3. **Dependencia de Chromium:** Puppeteer requiere descargar Chromium (~300MB)
   - **Mitigación:** Se descarga una sola vez en deployment
   - **Aceptable porque:** Es estándar en producción

4. **Sin preview antes de descargar**
   - **Mitigación futura:** Endpoint `/preview` que devuelve HTML
   - **Aceptable para MVP:** El usuario puede re-descargar si no le gusta

### 🎯 Decisiones conscientes

- **No implementar firma digital:** Fuera del alcance del MVP
- **No soportar múltiples idiomas:** Solo español en MVP
- **No personalización de templates por usuario:** Todos usan el mismo diseño
- **No watermarks en borradores:** Los presupuestos son iguales tengan el estado que tengan

---

## Plan de implementación

**⚠️ METODOLOGÍA TDD ESTRICTA: Cada fase sigue el ciclo Red-Green-Refactor**

1. 🔴 **RED**: Escribir test que falla
2. 🟢 **GREEN**: Implementar código mínimo para que pase
3. ♻️ **REFACTOR**: Mejorar código manteniendo tests en verde

**Regla de oro: NUNCA escribir código de producción sin un test que falle primero.**

---

### Fase 1: Setup y estructura (1 día)

**TDD Cycle 1: Formatters** ⏱️ ~2 horas

🔴 **RED - Escribir tests primero:**
```bash
# Crear archivo de test (implementación aún no existe)
touch tests/unit/templates/utils/formatters.test.ts

# Escribir tests que DEBEN FALLAR
npm run test:watch tests/unit/templates/utils/formatters.test.ts

# Tests esperados:
# ❌ formatCurrency is not defined
# ❌ formatDate is not defined
# ❌ escapeHtml is not defined
```

🟢 **GREEN - Implementar mínimo necesario:**
```bash
# Ahora sí, crear la implementación
touch src/templates/utils/formatters.ts

# Implementar funciones: formatCurrency, formatDate, escapeHtml
# Ejecutar tests hasta que PASEN
npm run test:watch

# Tests esperados:
# ✅ formatCurrency formats 1200.50 as "1.200,50 €"
# ✅ formatDate formats Date(2026-03-06) as "06/03/2026"
# ✅ escapeHtml escapes dangerous characters
```

♻️ **REFACTOR - Mejorar si es necesario (tests siguen en verde)**

---

**TDD Cycle 2: PDF Service** ⏱️ ~3 horas

🔴 **RED - Escribir tests primero:**
```bash
touch tests/unit/services/pdf.service.test.ts

npm run test:watch tests/unit/services/pdf.service.test.ts

# Tests que DEBEN FALLAR:
# ❌ generatePDF is not defined
# ❌ Cannot import pdf.service (file does not exist)
```

🟢 **GREEN - Implementar:**
```bash
touch src/services/pdf.service.ts

# Implementar generatePDF con Puppeteer
# Asegurar cierre de browser en finally

npm run test:watch

# Tests esperados:
# ✅ generatePDF should return PDF buffer from HTML
# ✅ generatePDF should close browser even if fails
# ✅ PDF buffer should start with "%PDF"
```

♻️ **REFACTOR**

### Fase 2: Templates HTML (2 días)

**TDD Cycle 3: Invoice Template** ⏱️ ~4 horas

🔴 **RED - Escribir tests primero:**
```bash
touch tests/unit/templates/invoice.template.test.ts

npm run test:watch tests/unit/templates/invoice.template.test.ts

# Tests que DEBEN FALLAR:
# ❌ renderInvoiceTemplate is not defined
# ❌ Template should include invoice number
# ❌ Template should include all emitter data
# ❌ Template should include all client data
# ❌ Template should render all lines
# ❌ Template should escape HTML in descriptions
```

🟢 **GREEN - Implementar:**
```bash
# Crear estilos primero (sin tests, es CSS)
touch src/templates/styles/document.styles.ts

# Crear template de factura
touch src/templates/invoice.template.ts

# Implementar renderInvoiceTemplate()

npm run test:watch

# Todos los tests deben PASAR ✅
```

♻️ **REFACTOR - Optimizar CSS/HTML si es necesario**

---

**TDD Cycle 4: Quote Template** ⏱️ ~3 horas

🔴 **RED - Escribir tests primero:**
```bash
touch tests/unit/templates/quote.template.test.ts

npm run test:watch tests/unit/templates/quote.template.test.ts

# Tests que DEBEN FALLAR:
# ❌ renderQuoteTemplate is not defined
# ❌ Template should show "PRESUPUESTO" in title
# ❌ Template should work without numero (optional)
# ❌ Template should render same as invoice except title
```

🟢 **GREEN - Implementar:**
```bash
touch src/templates/quote.template.ts

# Implementar renderQuoteTemplate (reutilizar estilos)

npm run test:watch

# Todos los tests deben PASAR ✅
```

♻️ **REFACTOR**

---

**Validación manual (solo después de tests en verde):**
```bash
# Crear script temporal para previsualizar HTML
node scripts/preview-template.js --invoice abc-123
# Abrir http://localhost:3000/preview
```

### Fase 3: Endpoints (2 días)

**TDD Cycle 5: Endpoints de PDF** ⏱️ ~6 horas

🔴 **RED - Escribir tests de integración primero:**
```bash
touch tests/integration/routes/pdf.routes.test.ts

npm run test:watch tests/integration/routes/pdf.routes.test.ts

# Tests que DEBEN FALLAR:
# ❌ GET /invoices/:id/pdf → 404 (ruta no existe)
# ❌ GET /quotes/:id/pdf → 404 (ruta no existe)
# ❌ Controllers not defined
# ❌ Routes not registered
```

🟢 **GREEN - Implementar capa por capa:**

**Paso 1: Tipos**
```bash
touch src/types/pdf.types.ts
# Definir interfaces: DocumentParty, DocumentLine, etc.
```

**Paso 2: Controladores**
```bash
touch src/controllers/pdf.controller.ts

# Implementar:
# - generateInvoicePDF()
# - generateQuotePDF()
# - mapInvoiceToTemplateData()
# - mapQuoteToTemplateData()
```

**Paso 3: Rutas**
```bash
touch src/routes/pdf.routes.ts

# Crear rutas:
# GET /invoices/:id/pdf
# GET /quotes/:id/pdf
```

**Paso 4: Registrar en app**
```bash
# Editar src/app.ts
# app.use('/api/v1', pdfRoutes);
```

**Ejecutar tests:**
```bash
npm run test:watch tests/integration/routes/pdf.routes.test.ts

# Todos los tests deben PASAR ✅:
# ✅ GET /invoices/:id/pdf → 200 (factura enviada)
# ✅ GET /invoices/:id/pdf → 422 (factura borrador)
# ✅ GET /invoices/:id/pdf → 404 (otro usuario)
# ✅ GET /invoices/:id/pdf → 401 (sin auth)
# ✅ GET /quotes/:id/pdf → 200 (borrador)
# ✅ GET /quotes/:id/pdf → 200 (enviado)
# ✅ Content-Type es application/pdf
# ✅ Content-Disposition tiene filename correcto
# ✅ PDF buffer es válido
```

♻️ **REFACTOR - Extraer helpers si hay duplicación**

---

**🚨 CHECKPOINT: Ejecutar TODOS los tests**
```bash
npm run test

# TODOS deben estar en verde ✅
# Si alguno falla → DETENER y corregir antes de continuar
```

### Fase 4: Optimización y documentación (1 día)

**⚠️ IMPORTANTE: Esta fase se ejecuta SOLO si todos los tests están en verde ✅**

**Tareas (sin TDD, es documentación y tipos):**

1. **Revisar y completar tipos TypeScript:**
   - Verificar `src/types/pdf.types.ts` está completo
   - Exportar todas las interfaces públicas
   - Añadir JSDoc a tipos complejos

2. **Documentar API en API.md:**
   ```markdown
   ### GET `/invoices/:id/pdf`
   Genera y descarga PDF de una factura enviada.
   - **Auth:** Requiere Bearer Token
   - **Response 200:** Archivo binario (application/pdf)
   - **Response 422:** Factura en estado borrador
   - **Response 404:** Factura no encontrada o no pertenece al usuario
   - **Response 401:** No autenticado
   
   ### GET `/quotes/:id/pdf`
   Genera y descarga PDF de un presupuesto.
   - **Auth:** Requiere Bearer Token
   - **Estados permitidos:** `borrador` y `enviado`
   - **Response 200:** Archivo binario (application/pdf)
   - **Response 404:** Presupuesto no encontrado o no pertenece al usuario
   - **Response 401:** No autenticado
   ```

3. **Actualizar decisions.md:**
   ```markdown
   ## [2026-03-06] Puppeteer para generación de PDFs

   ### Decisión
   Implementado Puppeteer para generar PDFs on-demand de facturas y presupuestos.

   ### Implementación
   - Templates HTML con CSS embebido en `src/templates/`
   - Generación on-demand sin almacenamiento (sin caché)
   - Validación de permisos server-side
   - Solo facturas `enviada` pueden descargarse
   - Presupuestos permiten descarga en ambos estados (`borrador`, `enviado`)

   ### Consecuencias
   ✅ Cumplimiento legal (facturas en PDF)
   ✅ Consistencia visual garantizada
   ⚠️ Consumo de recursos: ~150MB RAM por generación
   ```

4. **Crear helpers de testing (opcional):**
   ```typescript
   // tests/helpers/pdf.helpers.ts
   export const isPDFValid = (buffer: Buffer): boolean => {
     return buffer.toString('utf8', 0, 4) === '%PDF';
   };
   
   export const extractPDFText = async (buffer: Buffer): Promise<string> => {
     // Usar pdf-parse para extraer texto (útil para tests avanzados)
   };
   ```

5. **Añadir comentarios JSDoc en funciones públicas:**
   ```typescript
   /**
    * Genera un PDF desde HTML usando Puppeteer
    * @param html - String con HTML completo (incluye estilos)
    * @returns Buffer del PDF generado
    * @throws Error si Puppeteer falla al lanzar navegador
    */
   export const generatePDF = async (html: string): Promise<Buffer> => {
     // ...
   };
   ```

6. **Ejecutar verificación final:**
   ```bash
   # Todos los tests
   npm run test
   
   # Cobertura
   npm run test:coverage
   # Verificar >= 80% en servicios y controladores
   
   # Linter
   npm run lint
   
   # Type check
   npm run typecheck
   ```

### Fase 5: Testing manual y ajustes visuales (1 día)

**⚠️ PREREQUISITO: Todos los tests automatizados deben estar en verde ✅**

```bash
# Verificar antes de empezar testing manual
npm run test
# Debe mostrar: ✅ All tests passed
```

---

**Checklist de validación visual (PDF generados):**

**Facturas:**
- [ ] Descargar factura enviada con 1 línea → PDF correcto, no hay espacios vacíos excesivos
- [ ] Descargar factura enviada con 10 líneas → Tabla se ve completa, alineación correcta
- [ ] Intentar descargar factura borrador → Error 422 correcto
- [ ] Verificar número de factura visible: "2026/042"
- [ ] Verificar formateo de moneda: "1.200,50 €" (punto para miles, coma para decimales)
- [ ] Verificar formateo de fecha: "06/03/2026" (formato español)

**Presupuestos:**
- [ ] Descargar presupuesto borrador → PDF correcto
- [ ] Descargar presupuesto enviado → PDF correcto
- [ ] Presupuesto sin número → Muestra "PRESUPUESTO" sin número debajo
- [ ] Presupuesto con número → Muestra número correctamente

**Casos edge:**
- [ ] Factura con notas largas (500 caracteres) → Texto completo visible, no cortado
- [ ] Descripción con caracteres especiales: "Diseño & Desarrollo <Web>" → Escapado correcto
- [ ] Cliente con dirección muy larga → No se sale del contenedor
- [ ] 15+ líneas → Salto de página funciona, headers se repiten si es necesario

**Calidad visual:**
- [ ] Colores de headers se ven profesionales (no muy brillantes)
- [ ] Fuentes son legibles (tamaño >= 11pt para contenido)
- [ ] Espaciado entre secciones es adecuado (no muy apretado ni muy espacioso)
- [ ] Bordes de tabla son visibles pero no intrusivos
- [ ] Zebra striping en líneas mejora legibilidad

**Compatibilidad de impresión:**
- [ ] Imprimir PDF → Márgenes respetados, nada cortado
- [ ] Vista previa de impresión → Todo el contenido visible
- [ ] Imprimir en B&N → Contraste suficiente para leer

**Nombres de archivo:**
- [ ] Factura genera: `factura-2026-042.pdf`
- [ ] Presupuesto con número genera: `presupuesto-2026-001.pdf`
- [ ] Presupuesto sin número genera: `presupuesto-abc12345.pdf`

---

**Ajustes visuales esperados durante esta fase:**

Si encuentras problemas visuales, ajusta los estilos en `document.styles.ts`:
- Espaciado entre elementos (`margin`, `padding`)
- Tamaño de fuentes (`font-size`)
- Colores de headers (`background-color`, `color`)
- Ancho de columnas de tabla
- Márgenes del documento

**Después de cada ajuste:**
```bash
# Re-generar PDF de prueba
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/invoices/<id>/pdf \
  --output test.pdf

# Abrir y verificar
open test.pdf  # macOS
xdg-open test.pdf  # Linux
```

---

**✅ Criterio de finalización de Fase 5:**
Todos los checkboxes marcados y PDFs lucen profesionales.

### Timeline total: 7 días laborables

**Distribución temporal siguiendo TDD:**

```
📅 Día 1 - Setup + Tests básicos
├─ Mañana: Setup Puppeteer + Estructura de carpetas
├─ Tarde: TDD Cycle 1 (Formatters) → Tests ✅
└─ Noche: TDD Cycle 2 (PDF Service) → Tests ✅

📅 Día 2 - Templates (Parte 1)
├─ Mañana: TDD Cycle 3 (Invoice Template) → Escribir tests 🔴
├─ Tarde: Implementar Invoice Template → Tests ✅
└─ Checkpoint: npm run test → Todo verde ✅

📅 Día 3 - Templates (Parte 2)
├─ Mañana: TDD Cycle 4 (Quote Template) → Tests 🔴 → Implementación ✅
├─ Tarde: Ajustes visuales en CSS
└─ Validación manual: Preview HTML en navegador

📅 Día 4 - Endpoints (Parte 1)
├─ Mañana: TDD Cycle 5 → Escribir tests de integración 🔴
├─ Tarde: Implementar tipos + controladores (parcial)
└─ Tests aún fallan (se espera) 🔴

📅 Día 5 - Endpoints (Parte 2)
├─ Mañana: Completar controladores + rutas
├─ Tarde: Registrar en app.ts → Tests ✅
└─ Checkpoint CRÍTICO: npm run test → Todo verde ✅

📅 Día 6 - Documentación + Optimización
├─ Mañana: Actualizar API.md, decisions.md, JSDoc
├─ Tarde: Verificar cobertura (>=80%), linter, typecheck
└─ Todo el código limpio y documentado

📅 Día 7 - Testing manual + Ajustes finales
├─ Mañana: Validación visual completa (checklist)
├─ Tarde: Ajustes CSS si son necesarios
└─ ✅ Feature completa y lista para merge
```

**🚨 Regla crítica:** Si en cualquier momento los tests fallan y no puedes resolver en 30 minutos, DETÉN y reporta el problema antes de continuar.

---

## Criterios de éxito

### ✅ Funcionales

1. **Usuario puede descargar PDF de factura enviada**
   - Endpoint responde con status 200
   - Content-Type es `application/pdf`
   - El archivo se descarga con nombre correcto
   - **Facturas en estado `borrador` devuelven error 422**

2. **Usuario puede descargar PDF de presupuesto en cualquier estado**
   - Presupuesto `borrador` → 200 OK
   - Presupuesto `enviado` → 200 OK
   - Content-Type es `application/pdf`

3. **PDF contiene todos los datos obligatorios**
   - Número de factura visible (solo si es factura `enviada`)
   - Título "PRESUPUESTO" visible (para presupuestos)
   - Datos del emisor completos
   - Datos del cliente completos
   - Todas las líneas presentes
   - Totales calculados correctamente

4. **Validaciones funcionan correctamente**
   - Factura `borrador` → Error 422 con mensaje claro
   - Factura `enviada` de otro usuario → Error 404
   - Presupuesto de otro usuario → Error 404
   - Sin autenticación → Error 401

5. **Estados correctos en toda la aplicación**
   - El sistema solo maneja `borrador` y `enviada`/`enviado`
   - No hay otros estados en el código
   - Enums y validaciones usan solo estos dos estados

### ✅ Técnicos

1. **Tests pasan al 100%**
   ```bash
   npm run test
   # PASS  tests/unit/services/pdf.service.test.ts
   # PASS  tests/unit/templates/invoice.template.test.ts
   # PASS  tests/integration/routes/pdf.routes.test.ts
   ```

2. **Tiempo de respuesta < 5 segundos**
   - Medido con: `time curl -H "Authorization: Bearer ..." /invoices/:id/pdf`

3. **Sin memory leaks**
   - Verificar que browser se cierra siempre
   - Test: generar 100 PDFs consecutivos sin aumentar memoria

4. **Cobertura de código >= 80%**
   ```bash
   npm run test:coverage
   # services/pdf.service.ts: 90%
   # controllers/pdf.controller.ts: 85%
   # templates/*.template.ts: 80%
   ```

### ✅ Calidad visual

1. **PDF es profesional y legible**
   - Fuentes claras y proporcionales
   - Colores corporativos consistentes
   - Espaciado adecuado entre secciones

2. **Tabla de líneas bien formateada**
   - Columnas alineadas correctamente
   - Bordes visibles pero no intrusivos
   - Zebra striping para legibilidad

3. **Responsive a cantidad de líneas**
   - 1 línea → No desperdicia espacio
   - 15 líneas → Todo cabe en una página
   - >15 líneas → Salto de página correcto

4. **Imprimible sin problemas**
   - Márgenes respetados
   - Sin contenido cortado
   - Colores mantienen contraste en B&N

### ✅ Documentación

1. **API.md actualizado** con nuevos endpoints
2. **decisions.md actualizado** con decisión de Puppeteer
3. **README incluye** instrucciones de instalación de Puppeteer
4. **Código comentado** en partes complejas (generación HTML)

---

## Consideraciones de deployment

### Variables de entorno

**No requiere nuevas variables** - Puppeteer se configura con argumentos en código.

### Dependencias del sistema

**Railway/Render (PaaS):**
```dockerfile
# Puppeteer ya incluye Chromium, pero puede requerir dependencias:
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils
```

**Verificar en deployment:**
```bash
# Test de smoke después de deploy
curl -H "Authorization: Bearer test-token" \
     https://api.tuapp.com/invoices/test-id/pdf \
     --output test.pdf

# Verificar que el PDF es válido
file test.pdf
# Debe mostrar: test.pdf: PDF document, version 1.4
```

### Límites de recursos

**Memoria:**
- Puppeteer: ~150MB por proceso
- Límite de concurrencia: 10 PDFs simultáneos
- Total RAM requerida: ~2GB (con margen)

**Configuración recomendada Railway/Render:**
- Plan: Starter ($7/mes)
- RAM: 2GB
- CPU: Shared

### Monitorización

**Métricas a trackear:**
```typescript
// src/services/pdf.service.ts
import { logger } from '../lib/logger';

export const generatePDF = async (html: string): Promise<Buffer> => {
  const startTime = Date.now();
  
  try {
    const browser = await puppeteer.launch({ /* ... */ });
    // ... generación ...
    
    const duration = Date.now() - startTime;
    logger.info('PDF generated', { duration, size: pdf.length });
    
    return pdf;
  } catch (error) {
    logger.error('PDF generation failed', { error });
    throw error;
  }
};
```

**Alertas sugeridas:**
- Si tiempo de generación > 10 segundos → Alerta
- Si tasa de error > 5% → Alerta crítica
- Si uso de memoria > 1.8GB → Warning

---

## Riesgos y mitigaciones

### Riesgo 1: Puppeteer falla en producción

**Probabilidad:** Media  
**Impacto:** Alto  

**Mitigación:**
- Tests de integración robustos
- Smoke test post-deployment automático
- Documentar troubleshooting en README

**Plan B:**
- Fallback a PDFKit si Puppeteer falla
- Endpoint de health check: `GET /health/pdf`

### Riesgo 2: PDFs con muchas líneas se cortan

**Probabilidad:** Media  
**Impacto:** Alto (legal - factura incompleta)

**Mitigación:**
- Test con factura de 50 líneas
- CSS con `page-break-inside: avoid` en filas de tabla
- Validación manual de saltos de página

### Riesgo 3: Caracteres especiales rompen HTML

**Probabilidad:** Baja  
**Impacto:** Medio

**Mitigación:**
- Función `escapeHtml()` en todos los campos de usuario
- Test con caracteres: `<script>`, `&`, `"`, `'`, emojis

### Riesgo 4: Consumo excesivo de memoria

**Probabilidad:** Baja  
**Impacto:** Alto (crash del servidor)

**Mitigación:**
- Siempre cerrar browser con `finally`
- Límite de concurrencia (queue si es necesario)
- Monitorización de memoria

### Riesgo 5: Tiempo de respuesta >10s frustra usuarios

**Probabilidad:** Baja  
**Impacto:** Medio (UX)

**Mitigación:**
- Spinner en frontend con mensaje "Generando PDF..."
- Optimizar HTML (sin imágenes pesadas)
- Cache de browser de Puppeteer (evitar lanzar nuevo cada vez)

---

## Preguntas abiertas (para resolución futura)

1. **¿Permitir descarga de facturas borrador?**
   - Decisión actual: NO (solo enviadas)
   - Reconsiderar si usuarios lo piden

2. **¿Agregar logo del usuario en el PDF?**
   - Requiere upload de imágenes (Fase 6 - Storage)
   - Por ahora: Solo texto

3. **¿Soporte multi-idioma en PDFs?**
   - MVP: Solo español
   - Futuro: Inglés, catalán, etc.

4. **¿Customización de colores/fuentes?**
   - MVP: Diseño fijo para todos
   - Futuro: Settings de usuario

5. **¿Caché de PDFs generados?**
   - MVP: No (decisions.md)
   - Reconsiderar si generación se vuelve bottleneck

---

## Anexos

### Anexo A: Checklist completo de implementación (siguiendo TDD estricto)

```markdown
## Setup inicial
- [ ] Instalar Puppeteer: `npm install puppeteer`
- [ ] Verificar que descarga Chromium correctamente
- [ ] Crear estructura de carpetas vacías

## CICLO TDD 1: Formatters (Utilidades básicas)
- [ ] 🔴 Escribir test: tests/unit/templates/utils/formatters.test.ts
  - [ ] Test: formatCurrency debería formatear 1200.50 como "1.200,50 €"
  - [ ] Test: formatDate debería formatear Date(2026-03-06) como "06/03/2026"
  - [ ] Test: escapeHtml debería escapar caracteres peligrosos
  - [ ] Ejecutar: npm run test → DEBE FALLAR (funciones no existen)
- [ ] 🟢 Implementar: src/templates/utils/formatters.ts
  - [ ] Crear funciones formatCurrency, formatDate, escapeHtml
  - [ ] Ejecutar: npm run test → DEBE PASAR
- [ ] ♻️ Refactor si es necesario (mantener tests en verde)

## CICLO TDD 2: PDF Service (Generación básica)
- [ ] 🔴 Escribir test: tests/unit/services/pdf.service.test.ts
  - [ ] Test: generatePDF debería generar buffer PDF desde HTML simple
  - [ ] Test: generatePDF debería cerrar browser incluso si falla
  - [ ] Test: PDF generado debería empezar con "%PDF"
  - [ ] Ejecutar: npm run test → DEBE FALLAR (servicio no existe)
- [ ] 🟢 Implementar: src/services/pdf.service.ts
  - [ ] Crear función generatePDF con Puppeteer
  - [ ] Asegurar cierre de browser en finally
  - [ ] Ejecutar: npm run test → DEBE PASAR
- [ ] ♻️ Refactor si es necesario

## CICLO TDD 3: Templates (Generación HTML)
- [ ] 🔴 Escribir test: tests/unit/templates/invoice.template.test.ts
  - [ ] Test: renderInvoiceTemplate debería incluir número de factura
  - [ ] Test: debería incluir todos los datos del emisor
  - [ ] Test: debería incluir todos los datos del cliente
  - [ ] Test: debería renderizar todas las líneas
  - [ ] Test: debería calcular totales correctamente
  - [ ] Test: debería escapar HTML en descripciones
  - [ ] Ejecutar: npm run test → DEBE FALLAR
- [ ] 🟢 Implementar: 
  - [ ] src/templates/styles/document.styles.ts
  - [ ] src/templates/invoice.template.ts
  - [ ] Ejecutar: npm run test → DEBE PASAR
- [ ] ♻️ Refactor

- [ ] 🔴 Escribir test: tests/unit/templates/quote.template.test.ts
  - [ ] Test: renderQuoteTemplate debería mostrar "PRESUPUESTO" en título
  - [ ] Test: debería funcionar sin número (opcional)
  - [ ] Test: debería renderizar igual que factura (excepto título)
  - [ ] Ejecutar: npm run test → DEBE FALLAR
- [ ] 🟢 Implementar: src/templates/quote.template.ts
  - [ ] Reutilizar estilos de document.styles.ts
  - [ ] Ejecutar: npm run test → DEBE PASAR
- [ ] ♻️ Refactor

## CICLO TDD 4: Endpoints (Integración completa)
- [ ] 🔴 Escribir test: tests/integration/routes/pdf.routes.test.ts
  - [ ] Test: GET /invoices/:id/pdf → 200 OK (factura enviada)
  - [ ] Test: GET /invoices/:id/pdf → 422 (factura borrador)
  - [ ] Test: GET /invoices/:id/pdf → 404 (factura de otro usuario)
  - [ ] Test: GET /invoices/:id/pdf → 401 (sin autenticación)
  - [ ] Test: GET /quotes/:id/pdf → 200 OK (presupuesto borrador)
  - [ ] Test: GET /quotes/:id/pdf → 200 OK (presupuesto enviado)
  - [ ] Test: Content-Type debería ser "application/pdf"
  - [ ] Test: Content-Disposition debería tener filename correcto
  - [ ] Test: PDF buffer debería ser válido
  - [ ] Ejecutar: npm run test → DEBE FALLAR (endpoints no existen)
- [ ] 🟢 Implementar:
  - [ ] src/types/pdf.types.ts (interfaces)
  - [ ] src/controllers/pdf.controller.ts (generateInvoicePDF, generateQuotePDF)
  - [ ] src/routes/pdf.routes.ts (endpoints)
  - [ ] Registrar rutas en src/app.ts
  - [ ] Ejecutar: npm run test → DEBE PASAR
- [ ] ♻️ Refactor

## Validación manual (después de todos los tests en verde)
- [ ] Descargar factura 1 línea → Visual OK
- [ ] Descargar factura 10 líneas → Visual OK
- [ ] Descargar presupuesto borrador → Visual OK
- [ ] Descargar presupuesto enviado → Visual OK
- [ ] Verificar caracteres especiales en descripciones
- [ ] Verificar notas largas (500 caracteres)
- [ ] Verificar impresión (PDF → Imprimir)
- [ ] Verificar en diferentes navegadores (Chrome, Firefox, Safari)

## Documentación (después de implementación completa)
- [ ] Actualizar API.md con endpoints PDF
- [ ] Actualizar decisions.md con decisión Puppeteer
- [ ] Añadir comentarios JSDoc en funciones públicas
- [ ] Crear README en src/templates/ explicando estructura

## Deployment
- [ ] Todos los tests pasan: npm run test
- [ ] Cobertura >= 80%: npm run test:coverage
- [ ] Build exitoso: npm run build
- [ ] Verificar build en CI/CD
- [ ] Smoke test en staging
- [ ] Deploy a producción
- [ ] Smoke test en producción: curl /invoices/:id/pdf

## ⚠️ REGLA CRÍTICA: En cualquier momento que un test falle
- [ ] 🛑 DETENER implementación
- [ ] 📋 Analizar por qué falló
- [ ] 🔍 Corregir el CÓDIGO (no el test)
- [ ] ✅ Verificar que test pasa
- [ ] ➡️ Continuar con siguiente paso
```

### Anexo B: Ejemplo de factura completa (datos de test)

```json
{
  "id": "abc-123-def-456",
  "numero": "2026/042",
  "estado": "enviada",
  "fecha_emision": "2026-03-06",
  "user": {
    "nombre_comercial": "Juan Pérez - Consultoría IT",
    "nif": "12345678A",
    "direccion_fiscal": "Calle Mayor 1, 28001 Madrid",
    "telefono": "+34 600 123 456"
  },
  "client": {
    "nombre": "Empresa Demo SL",
    "cif_nif": "B87654321",
    "direccion": "Av. Diagonal 100, 08019 Barcelona",
    "email": "contacto@empresademo.com"
  },
  "lines": [
    {
      "descripcion": "Desarrollo de aplicación web MVP",
      "cantidad": 1,
      "precio_unitario": 3000.00,
      "iva_porcentaje": 21,
      "subtotal": 3000.00
    },
    {
      "descripcion": "Consultoría técnica (10 horas)",
      "cantidad": 10,
      "precio_unitario": 80.00,
      "iva_porcentaje": 21,
      "subtotal": 800.00
    }
  ],
  "subtotal": 3800.00,
  "total_iva": 798.00,
  "total": 4598.00,
  "notas": "Pago a 30 días desde la emisión de la factura.\nTransferencia bancaria a ES12 1234 1234 12 1234567890"
}
```

**PDF esperado:**
- Título: FACTURA
- Número: 2026/042
- Fecha: 06/03/2026
- Tabla con 2 líneas
- Total: 4.598,00 €

### Anexo C: Comandos útiles de desarrollo

```bash
# Generar un PDF de prueba localmente
npm run dev:pdf -- --invoice abc-123

# Ver HTML sin generar PDF (debug)
npm run preview:template -- --invoice abc-123

# Medir tiempo de generación
time curl -X GET http://localhost:3000/api/v1/invoices/abc-123/pdf \
  -H "Authorization: Bearer eyJ..." \
  --output test.pdf

# Validar que el PDF es correcto
file test.pdf
pdfinfo test.pdf

# Abrir PDF generado (macOS)
open test.pdf

# Ejecutar solo tests de PDF
npm run test:watch -- pdf
```

---

## Referencias

- **Puppeteer Docs:** https://pptr.dev
- **PDF/A Standard:** https://www.pdfa.org/resource/pdfa-1b/
- **Facturación España (Guía Agencia Tributaria):** https://sede.agenciatributaria.gob.es
- **HTML to PDF Best Practices:** https://medium.com/compass-true-north/go-service-to-convert-html-to-pdf-using-chromedp-5fd6f4b8e24d

---

**Última actualización:** 2026-03-06 (implementación completada)
**Próxima revisión:** Si se añaden nuevas features (logo, multi-idioma, caché)

---

## Notas de implementación

### Adaptaciones respecto al diseño original

- **Paths de archivos:** Controlador en `src/api/controllers/pdf.controller.ts` y rutas añadidas a los routers existentes (`invoice.routes.ts`, `quote.routes.ts`), no en un `src/routes/pdf.routes.ts` separado, para mantener consistencia con el codebase.
- **Templates en subfolder:** `src/templates/pdf/` en lugar de `src/templates/` para separar de los templates de email en `src/templates/email/`.
- **`req.user!.id`** (no `.userId`): El tipo `express.d.ts` expone `id`, no `userId`.
- **`formatCurrency` sin `style: 'currency'`:** La implementación usa `Intl.NumberFormat` sin currency style y añade ` €` manualmente para evitar diferencias de espacio NBSP (`\u00a0`) en distintas versiones de Node.js/ICU.

### Archivos creados
- `src/services/pdf.service.ts`
- `src/templates/pdf/invoice.template.ts`
- `src/templates/pdf/quote.template.ts`
- `src/templates/pdf/styles/document.styles.ts`
- `src/templates/pdf/utils/formatters.ts`
- `src/api/controllers/pdf.controller.ts`
- `src/types/pdf.types.ts`

### Archivos modificados
- `src/services/invoice.service.ts` — añadido `getById` y `INVOICE_DRAFT` constant
- `src/services/quote.service.ts` — añadido `getById`
- `src/api/routes/invoice.routes.ts` — añadida ruta `GET /:id/pdf`
- `src/api/routes/quote.routes.ts` — añadida ruta `GET /:id/pdf`

### Tests escritos (TDD)
- `tests/unit/templates/pdf/formatters.test.ts` (15 tests)
- `tests/unit/services/pdf.service.test.ts` (7 tests)
- `tests/unit/templates/pdf/invoice.template.test.ts` (15 tests)
- `tests/unit/templates/pdf/quote.template.test.ts` (14 tests)
- `tests/integration/pdf.test.ts` (14 tests)
