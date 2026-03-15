// prisma/seed.ts — Demo seed with safe mock data (no real PII)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain.trim(), 12);
}

async function main() {
  console.log("🌱 Seeding demo database...\n");

  // ─── Clients (safe mock data) ───────────────────────────────────
  const clients = [
    {
      name: "Familia García",
      student: "Sofía García",
      hourlyRate: 10000,
      grado: "8vo",
      modalidad: "Presencial",
      celular: "555-000-0001",
      direccion: "Calle Demo 123, Bogotá",
      correo: "sofia@demo.com",
      username: "sofia",
      characterName: "Artemia",
      characterClass: "guerrero",
      hp: 85,
      xp: 250,
      level: 3,
    },
    {
      name: "Familia Martínez",
      student: "Andrés Martínez",
      hourlyRate: 10000,
      grado: "10mo",
      modalidad: "Online",
      celular: "555-000-0002",
      direccion: "Avenida Demo 456, Bogotá",
      correo: "andres@demo.com",
      username: "andres",
      characterName: "Gandor",
      characterClass: "mago",
      hp: 100,
      xp: 150,
      level: 2,
    },
    {
      name: "Familia López",
      student: "Valentina López",
      hourlyRate: 10000,
      grado: "6to",
      modalidad: "Presencial",
      celular: "555-000-0003",
      direccion: "Carrera Demo 789, Bogotá",
      correo: "valentina@demo.com",
      username: "valentina",
      characterName: "Lara",
      characterClass: "explorador",
      hp: 70,
      xp: 80,
      level: 1,
    },
    {
      name: "Familia Torres",
      student: "Mateo Torres",
      hourlyRate: 10000,
      grado: "11vo",
      modalidad: "Online",
      celular: "555-000-0004",
      direccion: "Transversal Demo 321, Bogotá",
      correo: "mateo@demo.com",
      username: "mateo",
      characterName: "Blaze",
      characterClass: "guerrero",
      hp: 90,
      xp: 120,
      level: 2,
    },
    {
      name: "Familia Rodríguez",
      student: "Isabella Rodríguez",
      hourlyRate: 10000,
      grado: "9no",
      modalidad: "Presencial",
      celular: "555-000-0005",
      direccion: "Diagonal Demo 654, Bogotá",
      correo: "isabella@demo.com",
      username: "isabella",
      characterName: "Phoena",
      characterClass: "mago",
      hp: 55,
      xp: 320,
      level: 4,
    },
  ];

  const password = await hashPassword("demo1234");

  const createdClients: Array<{ id: string; name: string; hourlyRate: number }> = [];
  for (const c of clients) {
    const client = await prisma.client.upsert({
      where: { name: c.name },
      update: {
        characterName: c.characterName,
        characterClass: c.characterClass,
        hp: c.hp,
        xp: c.xp,
        level: c.level,
      },
      create: {
        name: c.name,
        student: c.student,
        hourlyRate: c.hourlyRate,
        currency: "COP",
        grado: c.grado,
        modalidad: c.modalidad,
        celular: c.celular,
        direccion: c.direccion,
        correo: c.correo,
        username: c.username,
        password,
        role: "CLIENT",
        hp: c.hp,
        xp: c.xp,
        level: c.level,
        characterName: c.characterName,
        characterClass: c.characterClass,
      },
    });
    createdClients.push(client);
    console.log(`  ✅ Client: ${c.name} (${c.student}) — user: ${c.username}`);
  }

  // ─── Sessions across Jan–Mar 2025 & Jan–Mar 2026 ───────────────
  const sessionData = [
    // ── January 2025 ──
    { clientIdx: 0, date: "2025-01-06", hours: 1.5 },
    { clientIdx: 0, date: "2025-01-13", hours: 1.0 },
    { clientIdx: 0, date: "2025-01-20", hours: 1.5 },
    { clientIdx: 1, date: "2025-01-07", hours: 2.0 },
    { clientIdx: 1, date: "2025-01-14", hours: 1.5 },
    { clientIdx: 1, date: "2025-01-21", hours: 2.0 },
    { clientIdx: 2, date: "2025-01-08", hours: 1.0 },
    { clientIdx: 2, date: "2025-01-15", hours: 1.5 },
    { clientIdx: 3, date: "2025-01-09", hours: 2.0 },
    { clientIdx: 3, date: "2025-01-16", hours: 1.5 },
    { clientIdx: 4, date: "2025-01-10", hours: 1.0 },
    { clientIdx: 4, date: "2025-01-17", hours: 2.0 },
    { clientIdx: 4, date: "2025-01-24", hours: 1.5 },
    // ── February 2025 ──
    { clientIdx: 0, date: "2025-02-03", hours: 1.5 },
    { clientIdx: 0, date: "2025-02-10", hours: 1.0 },
    { clientIdx: 0, date: "2025-02-17", hours: 2.0 },
    { clientIdx: 1, date: "2025-02-04", hours: 1.5 },
    { clientIdx: 1, date: "2025-02-11", hours: 2.0 },
    { clientIdx: 1, date: "2025-02-18", hours: 1.5 },
    { clientIdx: 2, date: "2025-02-05", hours: 1.0 },
    { clientIdx: 2, date: "2025-02-12", hours: 1.5 },
    { clientIdx: 2, date: "2025-02-19", hours: 1.0 },
    { clientIdx: 3, date: "2025-02-06", hours: 2.0 },
    { clientIdx: 3, date: "2025-02-13", hours: 1.5 },
    { clientIdx: 4, date: "2025-02-07", hours: 1.0 },
    { clientIdx: 4, date: "2025-02-14", hours: 2.0 },
    { clientIdx: 4, date: "2025-02-21", hours: 1.5 },
    // ── March 2025 ──
    { clientIdx: 0, date: "2025-03-03", hours: 1.5 },
    { clientIdx: 0, date: "2025-03-10", hours: 1.0 },
    { clientIdx: 0, date: "2025-03-17", hours: 1.5 },
    { clientIdx: 1, date: "2025-03-04", hours: 2.0 },
    { clientIdx: 1, date: "2025-03-11", hours: 1.5 },
    { clientIdx: 2, date: "2025-03-05", hours: 1.0 },
    { clientIdx: 2, date: "2025-03-12", hours: 1.5 },
    { clientIdx: 3, date: "2025-03-06", hours: 2.0 },
    { clientIdx: 3, date: "2025-03-13", hours: 1.5 },
    { clientIdx: 3, date: "2025-03-20", hours: 2.0 },
    { clientIdx: 4, date: "2025-03-07", hours: 1.0 },
    { clientIdx: 4, date: "2025-03-14", hours: 2.0 },
    // ── January 2026 ──
    { clientIdx: 0, date: "2026-01-05", hours: 1.5 },
    { clientIdx: 0, date: "2026-01-12", hours: 1.0 },
    { clientIdx: 0, date: "2026-01-19", hours: 2.0 },
    { clientIdx: 1, date: "2026-01-06", hours: 2.0 },
    { clientIdx: 1, date: "2026-01-13", hours: 1.5 },
    { clientIdx: 1, date: "2026-01-20", hours: 2.0 },
    { clientIdx: 2, date: "2026-01-07", hours: 1.0 },
    { clientIdx: 2, date: "2026-01-14", hours: 1.5 },
    { clientIdx: 3, date: "2026-01-08", hours: 2.0 },
    { clientIdx: 3, date: "2026-01-15", hours: 1.5 },
    { clientIdx: 3, date: "2026-01-22", hours: 1.0 },
    { clientIdx: 4, date: "2026-01-09", hours: 1.0 },
    { clientIdx: 4, date: "2026-01-16", hours: 2.0 },
    // ── February 2026 ──
    { clientIdx: 0, date: "2026-02-02", hours: 1.5 },
    { clientIdx: 0, date: "2026-02-09", hours: 1.0 },
    { clientIdx: 0, date: "2026-02-16", hours: 1.5 },
    { clientIdx: 1, date: "2026-02-03", hours: 2.0 },
    { clientIdx: 1, date: "2026-02-10", hours: 1.5 },
    { clientIdx: 1, date: "2026-02-17", hours: 2.0 },
    { clientIdx: 2, date: "2026-02-04", hours: 1.0 },
    { clientIdx: 2, date: "2026-02-11", hours: 1.5 },
    { clientIdx: 2, date: "2026-02-18", hours: 1.0 },
    { clientIdx: 3, date: "2026-02-05", hours: 2.0 },
    { clientIdx: 3, date: "2026-02-12", hours: 1.5 },
    { clientIdx: 4, date: "2026-02-06", hours: 1.0 },
    { clientIdx: 4, date: "2026-02-13", hours: 2.0 },
    { clientIdx: 4, date: "2026-02-20", hours: 1.5 },
    // ── March 2026 ──
    { clientIdx: 0, date: "2026-03-01", hours: 1.5 },
    { clientIdx: 0, date: "2026-03-04", hours: 1.0 },
    { clientIdx: 0, date: "2026-03-08", hours: 1.5 },
    { clientIdx: 1, date: "2026-03-02", hours: 2.0 },
    { clientIdx: 1, date: "2026-03-06", hours: 1.5 },
    { clientIdx: 1, date: "2026-03-10", hours: 2.0 },
    { clientIdx: 2, date: "2026-03-03", hours: 1.0 },
    { clientIdx: 2, date: "2026-03-07", hours: 1.5 },
    { clientIdx: 3, date: "2026-03-05", hours: 2.0 },
    { clientIdx: 3, date: "2026-03-09", hours: 1.5 },
    { clientIdx: 4, date: "2026-03-04", hours: 1.0 },
    { clientIdx: 4, date: "2026-03-11", hours: 2.0 },
  ];

  for (const s of sessionData) {
    const client = createdClients[s.clientIdx];
    const eventId = `demo-${client.id}-${s.date}`;
    await prisma.session.upsert({
      where: { eventId },
      update: {},
      create: {
        eventId,
        clientId: client.id,
        date: new Date(s.date),
        durationHours: s.hours,
        calculatedCost: Math.round(s.hours * client.hourlyRate * 100) / 100,
      },
    });
  }
  console.log(`  ✅ Sessions: ${sessionData.length} demo sessions created`);

  // ─── Monthly Balances (Jan–Mar 2025 & Jan–Mar 2026) ────────────
  const months = [
    { year: 2025, month: 1 },
    { year: 2025, month: 2 },
    { year: 2025, month: 3 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
  ];

  for (const m of months) {
    const balance = await prisma.monthlyBalance.upsert({
      where: { year_month: { year: m.year, month: m.month } },
      update: {},
      create: { year: m.year, month: m.month, status: "generated" },
    });

    // Find sessions in this month
    const monthSessions = sessionData.filter((s) => {
      const d = new Date(s.date);
      return d.getUTCFullYear() === m.year && d.getUTCMonth() + 1 === m.month;
    });

    // Group by client
    const clientHours: Record<number, number> = {};
    for (const s of monthSessions) {
      clientHours[s.clientIdx] = (clientHours[s.clientIdx] || 0) + s.hours;
    }

    for (const [idxStr, hours] of Object.entries(clientHours)) {
      const client = createdClients[Number(idxStr)];
      const totalCost = Math.round(hours * client.hourlyRate * 100) / 100;
      await prisma.balanceEntry.upsert({
        where: {
          balanceId_clientId: { balanceId: balance.id, clientId: client.id },
        },
        update: {},
        create: {
          balanceId: balance.id,
          clientId: client.id,
          clientName: client.name,
          individualCost: client.hourlyRate,
          hours,
          totalCost,
        },
      });
    }
    console.log(`  ✅ Balance: ${m.year}-${String(m.month).padStart(2, "0")} generated`);
  }

  // ─── Testimonials (public, safe to show) ────────────────────────
  const testimonials = [
    {
      clientName: "María G.",
      content:
        "Mi hija mejoró sus notas de matemáticas en dos meses. El método personalizado hace toda la diferencia.",
      rating: 5,
    },
    {
      clientName: "Carlos M.",
      content:
        "Excelente tutor. Las clases online funcionan muy bien y mi hijo se siente cómodo preguntando dudas.",
      rating: 5,
    },
    {
      clientName: "Ana R.",
      content:
        "La gamificación motiva mucho a mi hija. Ahora quiere estudiar para subir de nivel con su personaje.",
      rating: 4,
    },
    {
      clientName: "Pedro T.",
      content:
        "Profesional y puntual. Las clases de física se volvieron mucho más entendibles para mi hijo.",
      rating: 5,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: { ...t, visible: true } });
  }
  console.log(`  ✅ Testimonials: ${testimonials.length} created`);

  // ─── Stories (public, safe to show) ─────────────────────────────
  const stories = [
    {
      title: "De 3.0 a 4.8 en Matemáticas",
      content:
        "Sofía llegó con dificultades en álgebra. Después de 3 meses de clases personalizadas, logró subir su promedio significativamente y ahora disfruta resolver problemas.",
      visible: true,
    },
    {
      title: "Preparación ICFES exitosa",
      content:
        "Andrés necesitaba mejorar su puntaje ICFES para entrar a la universidad. Con un plan enfocado en sus áreas débiles, superó su meta por 30 puntos.",
      visible: true,
    },
  ];

  for (const s of stories) {
    await prisma.story.create({ data: s });
  }
  console.log(`  ✅ Stories: ${stories.length} created`);

  // ─── Exams (spread across 2025 & 2026) ─────────────────────────
  const exams = [
    // 2025
    { clientIdx: 0, title: "Quiz Aritmética", score: 7.5, date: "2025-01-15", commentary: "Buen manejo de operaciones básicas" },
    { clientIdx: 0, title: "Parcial Pre-Álgebra", score: 6.8, date: "2025-02-12", commentary: "Mejorar despeje de variables" },
    { clientIdx: 0, title: "Parcial Álgebra I", score: 8.0, date: "2025-03-14", commentary: "Gran avance en ecuaciones" },
    { clientIdx: 1, title: "Quiz Mecánica", score: 5.5, date: "2025-01-20", commentary: "Dificultad con vectores" },
    { clientIdx: 1, title: "Parcial Cinemática", score: 7.0, date: "2025-02-18", commentary: "Mejoró en MRU, trabajar MRUV" },
    { clientIdx: 1, title: "Parcial Dinámica", score: 7.5, date: "2025-03-15", commentary: "Buen manejo de diagramas de fuerza" },
    { clientIdx: 2, title: "Quiz Naturales", score: 8.5, date: "2025-01-22", commentary: "Excelente en ecosistemas" },
    { clientIdx: 2, title: "Parcial Biología", score: 9.0, date: "2025-02-19", commentary: "Domina célula y tejidos" },
    { clientIdx: 3, title: "Quiz Funciones", score: 6.0, date: "2025-01-23", commentary: "Reforzar dominio y rango" },
    { clientIdx: 3, title: "Parcial Trigonometría", score: 7.2, date: "2025-02-20", commentary: "Mejorar identidades" },
    { clientIdx: 3, title: "Parcial Analítica", score: 8.0, date: "2025-03-18", commentary: "Buen manejo de cónicas" },
    { clientIdx: 4, title: "Quiz Pre-Cálculo", score: 7.0, date: "2025-01-24", commentary: "Bien en límites básicos" },
    { clientIdx: 4, title: "Parcial Derivadas", score: 6.5, date: "2025-02-21", commentary: "Practicar regla de la cadena" },
    { clientIdx: 4, title: "Quiz Integrales", score: 8.0, date: "2025-03-20", commentary: "Buen avance en integración" },
    // 2026
    { clientIdx: 0, title: "Quiz Álgebra II", score: 8.2, date: "2026-01-14", commentary: "Sólida en factorización" },
    { clientIdx: 0, title: "Parcial Álgebra", score: 8.5, date: "2026-02-15", commentary: "Excelente manejo de ecuaciones lineales" },
    { clientIdx: 0, title: "Quiz Geometría", score: 7.0, date: "2026-03-01", commentary: "Bien en áreas, mejorar volúmenes" },
    { clientIdx: 0, title: "Parcial Trigonometría", score: 9.2, date: "2026-03-10", commentary: "Domina identidades trigonométricas" },
    { clientIdx: 1, title: "Quiz Ondas", score: 7.5, date: "2026-01-16", commentary: "Buen entendimiento de frecuencia" },
    { clientIdx: 1, title: "Parcial Física", score: 6.5, date: "2026-02-20", commentary: "Necesita practicar más problemas de fuerza" },
    { clientIdx: 1, title: "Quiz Química", score: 8.0, date: "2026-03-05", commentary: "Buen manejo de balanceo de ecuaciones" },
    { clientIdx: 2, title: "Quiz Geografía", score: 8.0, date: "2026-01-15", commentary: "Buen manejo de coordenadas" },
    { clientIdx: 2, title: "Parcial Ciencias", score: 9.0, date: "2026-03-03", commentary: "Excelente comprensión del tema" },
    { clientIdx: 2, title: "Quiz Matemáticas", score: 4.5, date: "2026-03-08", commentary: "Revisar fracciones y decimales" },
    { clientIdx: 3, title: "Parcial Cálculo I", score: 7.5, date: "2026-01-20", commentary: "Buen manejo de derivadas" },
    { clientIdx: 3, title: "Quiz Estadística", score: 8.0, date: "2026-02-16", commentary: "Domina probabilidad básica" },
    { clientIdx: 3, title: "Parcial Cálculo II", score: 8.5, date: "2026-03-12", commentary: "Excelente en integrales definidas" },
    { clientIdx: 4, title: "Parcial Cálculo", score: 7.8, date: "2026-02-28", commentary: "Buena comprensión de límites" },
    { clientIdx: 4, title: "Quiz Estadística", score: 8.5, date: "2026-03-12", commentary: "Domina medidas de tendencia central" },
  ];

  for (const e of exams) {
    await prisma.exam.create({
      data: {
        clientId: createdClients[e.clientIdx].id,
        title: e.title,
        score: e.score,
        date: new Date(e.date),
        commentary: e.commentary,
      },
    });
  }
  console.log(`  ✅ Exams: ${exams.length} created`);

  // ─── Progress Notes (spread across 2025 & 2026) ────────────────
  const notes = [
    // 2025
    { clientIdx: 0, content: "Sofía inicia con buen ánimo. Diagnóstico: reforzar álgebra básica.", date: "2025-01-06", color: "#3b82f6" },
    { clientIdx: 0, content: "Progreso notable en operaciones con fracciones.", date: "2025-02-03", color: "#22c55e" },
    { clientIdx: 0, content: "Completó módulo de pre-álgebra exitosamente.", date: "2025-03-03", color: "#22c55e" },
    { clientIdx: 1, content: "Andrés tiene base teórica pero falta práctica de problemas.", date: "2025-01-07", color: "#eab308" },
    { clientIdx: 1, content: "Mejora constante en problemas de cinemática.", date: "2025-02-04", color: "#22c55e" },
    { clientIdx: 1, content: "Listo para empezar dinámica. Buen progreso.", date: "2025-03-04", color: "#3b82f6" },
    { clientIdx: 2, content: "Valentina muy curiosa. Le encanta biología.", date: "2025-01-08", color: "#a855f7" },
    { clientIdx: 2, content: "Excelente participación en clase de ecosistemas.", date: "2025-02-05", color: "#22c55e" },
    { clientIdx: 3, content: "Mateo necesita reforzar funciones básicas antes de trigonometría.", date: "2025-01-09", color: "#f97316" },
    { clientIdx: 3, content: "Avance en identidades trigonométricas. Buen ritmo.", date: "2025-02-06", color: "#22c55e" },
    { clientIdx: 3, content: "Completó unidad de trigonometría. Iniciar analítica.", date: "2025-03-06", color: "#3b82f6" },
    { clientIdx: 4, content: "Isabella tiene aptitud para matemáticas avanzadas.", date: "2025-01-10", color: "#a855f7" },
    { clientIdx: 4, content: "Dificultad con regla de la cadena. Reforzar con más ejercicios.", date: "2025-02-07", color: "#eab308" },
    { clientIdx: 4, content: "Superó la dificultad. Avanza bien en integración.", date: "2025-03-07", color: "#22c55e" },
    // 2026
    { clientIdx: 0, content: "Año nuevo, Sofía retoma con energía. Metas claras para el semestre.", date: "2026-01-05", color: "#3b82f6" },
    { clientIdx: 0, content: "Excelente resultado en parcial de álgebra. Seguir así.", date: "2026-02-16", color: "#22c55e" },
    { clientIdx: 0, content: "Sofía mostró gran mejoría en resolución de problemas. Mantener ritmo de práctica.", date: "2026-03-01", color: "#22c55e" },
    { clientIdx: 0, content: "Pequeña dificultad con geometría analítica. Reforzar con ejercicios adicionales.", date: "2026-03-08", color: "#eab308" },
    { clientIdx: 1, content: "Andrés motivado con preparación ICFES. Plan de estudio definido.", date: "2026-01-06", color: "#3b82f6" },
    { clientIdx: 1, content: "Andrés completó todos los ejercicios de preparación ICFES. Muy motivado.", date: "2026-03-02", color: "#3b82f6" },
    { clientIdx: 1, content: "Revisamos física mecánica. Necesita más práctica con diagramas de cuerpo libre.", date: "2026-03-10", color: "#f97316" },
    { clientIdx: 2, content: "Valentina tiene excelente actitud. Avanza rápido en ciencias naturales.", date: "2026-03-03", color: "#22c55e" },
    { clientIdx: 3, content: "Mateo empezó cálculo con buena base de analítica.", date: "2026-01-08", color: "#22c55e" },
    { clientIdx: 3, content: "Buen desempeño en estadística. Listo para cálculo II.", date: "2026-02-16", color: "#3b82f6" },
    { clientIdx: 4, content: "Isabella domina derivadas. Lista para avanzar a integrales.", date: "2026-02-06", color: "#a855f7" },
    { clientIdx: 4, content: "Excelente sesión de estadística. Comprende bien distribuciones de probabilidad.", date: "2026-03-12", color: "#22c55e" },
  ];

  for (const n of notes) {
    await prisma.progressNote.create({
      data: {
        clientId: createdClients[n.clientIdx].id,
        content: n.content,
        date: new Date(n.date),
        color: n.color,
      },
    });
  }
  console.log(`  ✅ Progress Notes: ${notes.length} created`);

  // ─── Suggestions (buzón) ────────────────────────────────────────
  const suggestions = [
    { clientIdx: 0, message: "¿Podríamos tener una clase extra antes del parcial?", status: "read" },
    { clientIdx: 1, message: "Me gustaría más ejercicios de práctica para ICFES.", status: "unread" },
    { clientIdx: 2, message: "¡Las clases son muy divertidas! Me gusta el sistema de puntos.", status: "read" },
    { clientIdx: 3, message: "Las clases online son muy cómodas. ¿Se pueden grabar para repasar?", status: "unread" },
    { clientIdx: 4, message: "¿Es posible agregar sesiones de cálculo los sábados?", status: "unread" },
  ];

  for (const s of suggestions) {
    await prisma.suggestion.create({
      data: {
        clientId: createdClients[s.clientIdx].id,
        message: s.message,
        status: s.status,
      },
    });
  }
  console.log(`  ✅ Suggestions: ${suggestions.length} created`);

  // ─── Leads (from neuron game) ───────────────────────────────────
  const leads = [
    { name: "Juan Demo", email: "juan@demo.com", phone: "555-111-0001", gameScore: 450, difficulty: "medium" },
    { name: "Laura Demo", email: "laura@demo.com", phone: "555-111-0002", gameScore: 680, difficulty: "hard" },
    { name: "Diego Demo", email: "diego@demo.com", phone: null, gameScore: 320, difficulty: "easy" },
    { name: "Camila Demo", email: "camila@demo.com", phone: "555-111-0003", gameScore: 510, difficulty: "medium" },
    { name: "Santiago Demo", email: "santiago@demo.com", phone: null, gameScore: 890, difficulty: "hard" },
  ];

  for (const l of leads) {
    await prisma.lead.upsert({
      where: { email: l.email },
      update: {},
      create: l,
    });
  }
  console.log(`  ✅ Leads: ${leads.length} created`);

  // ─── Summary ────────────────────────────────────────────────────
  console.log("\n🎉 Demo database seeded successfully!");
  console.log("\n📋 Login credentials (all passwords: demo1234):");
  console.log("   sofia     — Guerrero Lv3, has exams & notes");
  console.log("   andres    — Mago Lv2, ICFES prep");
  console.log("   valentina — Explorador Lv1, young student");
  console.log("   mateo     — Guerrero Lv2, online student");
  console.log("   isabella  — Mago Lv4, advanced student");
  console.log("\n📅 Data spans: Jan–Mar 2025 & Jan–Mar 2026");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
