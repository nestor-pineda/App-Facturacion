/**
 * Seed script — popula la base de datos con datos de prueba.
 *
 * Crea:
 *  - 1 usuario autónomo de prueba
 *  - 3 clientes
 *  - 5 servicios del catálogo
 *  - 5 presupuestos (3 borrador, 2 enviado) con sus líneas
 *  - 5 facturas (2 borrador, 3 enviada) con sus líneas
 *
 * Es idempotente: limpia los datos del usuario de prueba antes de insertar.
 *
 * Uso:
 *   cd backend
 *   npx ts-node -r tsconfig-paths/register scripts/seed.ts
 */

import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Siempre backend/.env (no depende del cwd). override: true evita que un DATABASE_URL
// residual en la shell apunte a otra instancia distinta de la que ves en tu cliente SQL.
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error(`❌ DATABASE_URL no está definida. Añádela en ${envPath}`);
  process.exit(1);
}

function logDatabaseTarget(urlStr: string) {
  try {
    const { hostname, port, pathname } = new URL(urlStr);
    const dbName = decodeURIComponent(pathname.replace(/^\//, '') || '(sin nombre)');
    const portPart = port ? `:${port}` : '';
    console.log(`📡 Destino: ${hostname}${portPart} → "${dbName}" (tablas: users, clients, …)\n`);
  } catch {
    console.log('📡 DATABASE_URL definida; comprueba host/puerto en tu cliente SQL.\n');
  }
}

logDatabaseTarget(DATABASE_URL);

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Credenciales del usuario de prueba ──────────────────────────────────────

const SEED_USER_EMAIL = 'admin@facturacion.test';
const SEED_USER_PASSWORD_MIN_LENGTH = 12;
const SEED_USER_PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const SEED_USER_PASSWORD = 'SeedAdmin2026';

function ensureSeedPasswordStrength(password: string) {
  if (password.length < SEED_USER_PASSWORD_MIN_LENGTH) {
    throw new Error(
      `SEED_USER_PASSWORD debe tener mínimo ${SEED_USER_PASSWORD_MIN_LENGTH} caracteres.`,
    );
  }

  if (!SEED_USER_PASSWORD_COMPLEXITY_REGEX.test(password)) {
    throw new Error(
      'SEED_USER_PASSWORD debe incluir al menos una minúscula, una mayúscula y un número.',
    );
  }
}

// ─── Helpers de cálculo ───────────────────────────────────────────────────────

function calcLine(cantidad: number, precioUnitario: number, ivaPorcentaje: number) {
  const subtotal = cantidad * precioUnitario;
  const cuotaIva = subtotal * (ivaPorcentaje / 100);
  return { subtotal, cuotaIva };
}

function calcTotals(lines: { subtotal: number; cuotaIva: number }[]) {
  const subtotal = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const total_iva = lines.reduce((acc, l) => acc + l.cuotaIva, 0);
  return { subtotal, total_iva, total: subtotal + total_iva };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed...\n');
  ensureSeedPasswordStrength(SEED_USER_PASSWORD);

  // ── Limpieza previa del usuario de prueba (para idempotencia) ──────────────
  const existing = await prisma.user.findUnique({ where: { email: SEED_USER_EMAIL } });

  if (existing) {
    console.log('♻️  Usuario de prueba encontrado. Limpiando datos previos...');
    await prisma.invoiceLine.deleteMany({ where: { invoice: { user_id: existing.id } } });
    await prisma.invoice.deleteMany({ where: { user_id: existing.id } });
    await prisma.quoteLine.deleteMany({ where: { quote: { user_id: existing.id } } });
    await prisma.quote.deleteMany({ where: { user_id: existing.id } });
    await prisma.service.deleteMany({ where: { user_id: existing.id } });
    await prisma.client.deleteMany({ where: { user_id: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('   ✅ Datos previos eliminados.\n');
  }

  // ── Usuario ────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(SEED_USER_PASSWORD, 12);

  const user = await prisma.user.create({
    data: {
      email: SEED_USER_EMAIL,
      password: hashedPassword,
      nombre_comercial: 'Estudio Digital Prueba',
      nif: '12345678Z',
      direccion_fiscal: 'Calle Falsa 123, 28001 Madrid',
      telefono: '600123456',
    },
  });

  console.log(`👤 Usuario creado: ${user.email} / ${SEED_USER_PASSWORD}`);

  // ── Clientes ───────────────────────────────────────────────────────────────
  const [clienteAlpha, clienteBeta, clienteGamma] = await Promise.all([
    prisma.client.create({
      data: {
        user_id: user.id,
        nombre: 'Alpha Solutions S.L.',
        email: 'contacto@alpha-solutions.es',
        cif_nif: 'B12345678',
        direccion: 'Av. de la Innovación 5, 08001 Barcelona',
      },
    }),
    prisma.client.create({
      data: {
        user_id: user.id,
        nombre: 'Beta Retail S.A.',
        email: 'admin@betaretail.com',
        cif_nif: 'A87654321',
        direccion: 'Gran Vía 100, 48001 Bilbao',
      },
    }),
    prisma.client.create({
      data: {
        user_id: user.id,
        nombre: 'Gamma Consulting',
        email: 'info@gammaconsulting.es',
        cif_nif: 'B98765432',
        direccion: 'Paseo de Gracia 22, 08002 Barcelona',
      },
    }),
  ]);

  console.log('🏢 3 clientes creados.');

  // ── Servicios (catálogo) ───────────────────────────────────────────────────
  const [svcDiseno, svcSeo, svcConsultoria, svcMantenimiento, svcApp] = await Promise.all([
    prisma.service.create({
      data: {
        user_id: user.id,
        nombre: 'Diseño Web Corporativo',
        descripcion: 'Diseño y maquetación completa de sitio web corporativo (hasta 10 páginas).',
        precio_base: 800,
        iva_porcentaje: 21,
      },
    }),
    prisma.service.create({
      data: {
        user_id: user.id,
        nombre: 'SEO Mensual',
        descripcion: 'Posicionamiento SEO: auditoría, optimización on-page y reporting mensual.',
        precio_base: 350,
        iva_porcentaje: 21,
      },
    }),
    prisma.service.create({
      data: {
        user_id: user.id,
        nombre: 'Consultoría Estratégica (por hora)',
        descripcion: 'Sesión de consultoría en estrategia digital y transformación tecnológica.',
        precio_base: 150,
        iva_porcentaje: 21,
      },
    }),
    prisma.service.create({
      data: {
        user_id: user.id,
        nombre: 'Mantenimiento Web Mensual',
        descripcion: 'Actualización de CMS, plugins, backups y monitorización de disponibilidad.',
        precio_base: 120,
        iva_porcentaje: 21,
      },
    }),
    prisma.service.create({
      data: {
        user_id: user.id,
        nombre: 'Desarrollo de App Móvil',
        descripcion: 'Desarrollo de aplicación móvil multiplataforma (React Native). Precio por módulo.',
        precio_base: 2500,
        iva_porcentaje: 21,
      },
    }),
  ]);

  console.log('🛠️  5 servicios creados.');

  // ── Presupuestos ───────────────────────────────────────────────────────────
  console.log('\n📄 Creando presupuestos...');

  // Presupuesto 1 — borrador — Alpha
  {
    const l1 = calcLine(1, 800, 21);    // Diseño Web ×1
    const l2 = calcLine(3, 350, 21);    // SEO ×3 meses
    const totals = calcTotals([l1, l2]);
    await prisma.quote.create({
      data: {
        user_id: user.id,
        client_id: clienteAlpha.id,
        estado: 'borrador',
        fecha: new Date('2026-03-01'),
        notas: 'Incluye 3 revisiones de diseño sin coste adicional.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcDiseno.id,
              descripcion: svcDiseno.nombre,
              cantidad: 1,
              precio_unitario: 800,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcSeo.id,
              descripcion: svcSeo.nombre,
              cantidad: 3,
              precio_unitario: 350,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Presupuesto 1 — borrador (Alpha)');
  }

  // Presupuesto 2 — borrador — Beta
  {
    const l1 = calcLine(5, 150, 21);    // Consultoría ×5h
    const l2 = calcLine(2, 120, 21);    // Mantenimiento ×2 meses
    const totals = calcTotals([l1, l2]);
    await prisma.quote.create({
      data: {
        user_id: user.id,
        client_id: clienteBeta.id,
        estado: 'borrador',
        fecha: new Date('2026-03-05'),
        notas: 'Consultoría inicial de diagnóstico + primeros 2 meses de mantenimiento.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcConsultoria.id,
              descripcion: svcConsultoria.nombre,
              cantidad: 5,
              precio_unitario: 150,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcMantenimiento.id,
              descripcion: svcMantenimiento.nombre,
              cantidad: 2,
              precio_unitario: 120,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Presupuesto 2 — borrador (Beta)');
  }

  // Presupuesto 3 — borrador — Gamma
  {
    const l1 = calcLine(1, 800, 21);    // Diseño Web ×1
    const l2 = calcLine(10, 150, 21);   // Consultoría ×10h
    const totals = calcTotals([l1, l2]);
    await prisma.quote.create({
      data: {
        user_id: user.id,
        client_id: clienteGamma.id,
        estado: 'borrador',
        fecha: new Date('2026-03-07'),
        notas: 'Proyecto llave en mano: diseño web + consultoría de estrategia digital.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcDiseno.id,
              descripcion: svcDiseno.nombre,
              cantidad: 1,
              precio_unitario: 800,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcConsultoria.id,
              descripcion: svcConsultoria.nombre,
              cantidad: 10,
              precio_unitario: 150,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Presupuesto 3 — borrador (Gamma)');
  }

  // Presupuesto 4 — enviado — Alpha
  {
    const l1 = calcLine(1, 2500, 21);   // App Móvil ×1
    const totals = calcTotals([l1]);
    await prisma.quote.create({
      data: {
        user_id: user.id,
        client_id: clienteAlpha.id,
        estado: 'enviado',
        fecha: new Date('2026-02-10'),
        notas: 'Módulo 1: autenticación y panel de usuario. Entrega estimada 6 semanas.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcApp.id,
              descripcion: svcApp.nombre,
              cantidad: 1,
              precio_unitario: 2500,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Presupuesto 4 — enviado (Alpha)');
  }

  // Presupuesto 5 — enviado — Beta
  {
    const l1 = calcLine(6, 350, 21);    // SEO ×6 meses
    const l2 = calcLine(6, 120, 21);    // Mantenimiento ×6 meses
    const totals = calcTotals([l1, l2]);
    await prisma.quote.create({
      data: {
        user_id: user.id,
        client_id: clienteBeta.id,
        estado: 'enviado',
        fecha: new Date('2026-02-15'),
        notas: 'Contrato semestral SEO + mantenimiento. Descuento del 5% aplicado en precio unitario.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcSeo.id,
              descripcion: svcSeo.nombre,
              cantidad: 6,
              precio_unitario: 350,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcMantenimiento.id,
              descripcion: svcMantenimiento.nombre,
              cantidad: 6,
              precio_unitario: 120,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Presupuesto 5 — enviado (Beta)');
  }

  // ── Facturas ───────────────────────────────────────────────────────────────
  console.log('\n🧾 Creando facturas...');

  // Factura 1 — enviada — 2026/001 — Gamma
  {
    const l1 = calcLine(1, 2500, 21);
    const totals = calcTotals([l1]);
    await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clienteGamma.id,
        numero: '2026/001',
        estado: 'enviada',
        fecha_emision: new Date('2026-01-15'),
        notas: 'Desarrollo módulo de gestión de pedidos. Pago a 30 días.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcApp.id,
              descripcion: svcApp.nombre,
              cantidad: 1,
              precio_unitario: 2500,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Factura 1 — enviada 2026/001 (Gamma)');
  }

  // Factura 2 — enviada — 2026/002 — Alpha
  {
    const l1 = calcLine(1, 800, 21);
    const l2 = calcLine(3, 350, 21);
    const totals = calcTotals([l1, l2]);
    await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clienteAlpha.id,
        numero: '2026/002',
        estado: 'enviada',
        fecha_emision: new Date('2026-02-01'),
        notas: 'Proyecto web corporativo fase 1 + SEO primeros 3 meses.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcDiseno.id,
              descripcion: svcDiseno.nombre,
              cantidad: 1,
              precio_unitario: 800,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcSeo.id,
              descripcion: svcSeo.nombre,
              cantidad: 3,
              precio_unitario: 350,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Factura 2 — enviada 2026/002 (Alpha)');
  }

  // Factura 3 — enviada — 2026/003 — Beta
  {
    const l1 = calcLine(8, 150, 21);
    const totals = calcTotals([l1]);
    await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clienteBeta.id,
        numero: '2026/003',
        estado: 'enviada',
        fecha_emision: new Date('2026-02-20'),
        notas: 'Consultoría estratégica sesiones enero-febrero 2026.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcConsultoria.id,
              descripcion: svcConsultoria.nombre,
              cantidad: 8,
              precio_unitario: 150,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Factura 3 — enviada 2026/003 (Beta)');
  }

  // Factura 4 — borrador — Gamma
  {
    const l1 = calcLine(12, 120, 21);
    const totals = calcTotals([l1]);
    await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clienteGamma.id,
        estado: 'borrador',
        fecha_emision: new Date('2026-03-01'),
        notas: 'Contrato anual de mantenimiento web 2026. Pendiente de aprobación.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcMantenimiento.id,
              descripcion: svcMantenimiento.nombre,
              cantidad: 12,
              precio_unitario: 120,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Factura 4 — borrador (Gamma)');
  }

  // Factura 5 — borrador — Alpha
  {
    const l1 = calcLine(1, 2500, 21);
    const l2 = calcLine(20, 150, 21);
    const totals = calcTotals([l1, l2]);
    await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clienteAlpha.id,
        estado: 'borrador',
        fecha_emision: new Date('2026-03-08'),
        notas: 'Módulo 2 app móvil + consultoría de arquitectura técnica.',
        ...totals,
        lines: {
          create: [
            {
              service_id: svcApp.id,
              descripcion: svcApp.nombre,
              cantidad: 1,
              precio_unitario: 2500,
              iva_porcentaje: 21,
              subtotal: l1.subtotal,
            },
            {
              service_id: svcConsultoria.id,
              descripcion: svcConsultoria.nombre,
              cantidad: 20,
              precio_unitario: 150,
              iva_porcentaje: 21,
              subtotal: l2.subtotal,
            },
          ],
        },
      },
    });
    console.log('   ✅ Factura 5 — borrador (Alpha)');
  }

  const userRows = await prisma.user.count({ where: { email: SEED_USER_EMAIL } });
  const invoiceRows = await prisma.invoice.count({ where: { user_id: user.id } });
  console.log(
    `\n🔎 Lectura inmediata en esta conexión: ${userRows} usuario(s) seed, ${invoiceRows} factura(s).`,
  );

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed completado con éxito.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Credenciales de acceso:');
  console.log(`  Email   : ${SEED_USER_EMAIL}`);
  console.log(`  Password: ${SEED_USER_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((err) => {
    console.error('❌ Error durante el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
