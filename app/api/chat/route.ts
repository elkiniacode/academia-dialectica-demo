import { NextResponse } from "next/server";
import { streamText, tool } from "ai";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getDashboardKPIs,
  getClientRevenueMatrix,
  getClientGrowthData,
  getYearComparisonData,
} from "@/lib/actions/dashboard-actions";
import { fetchMonthlyBalance, getAvailableBalances } from "@/lib/actions/fetch-balance";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

type Provider = "claude" | "openai" | "gemini";

function getModel(provider: Provider) {
  switch (provider) {
    case "claude":
      return anthropic("claude-sonnet-4-20250514");
    case "openai":
      return openai("gpt-4o-mini");
    case "gemini":
      return google("gemini-2.5-flash");
  }
}

const chatTools = {
  obtener_clientes: tool({
    description:
      "Obtiene la lista de todos los clientes con nombre, tarifa, moneda, estudiante, modalidad, grado, datos de gamificación y fecha de creación. Úsala para preguntas sobre clientes específicos o listar clientes.",
    parameters: z.object({}),
    execute: async () => {
      const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
      // Redact PII before sending to third-party AI providers
      return clients.map(
        ({ celular, direccion, correo, password, username, ...safe }) => safe
      );
    },
  }),

  obtener_kpis_mensuales: tool({
    description:
      "Obtiene KPIs mensuales de un año: ingresos totales, horas, número de clases, costo promedio por clase, clases promedio por semana y por día. Úsala para rendimiento financiero o promedios.",
    parameters: z.object({
      year: z.number().describe("Año a consultar, ej: 2026"),
    }),
    execute: async ({ year }) => getDashboardKPIs(year),
  }),

  obtener_matriz_ingresos_clientes: tool({
    description:
      "Matriz de ingresos por cliente y mes para un año. Muestra cuánto generó cada cliente, ranking por ingresos, totales mensuales y gran total. Úsala para '¿quién genera más ingresos?' o desglose por cliente.",
    parameters: z.object({
      year: z.number().describe("Año a consultar"),
    }),
    execute: async ({ year }) => getClientRevenueMatrix(year),
  }),

  obtener_crecimiento_clientes: tool({
    description:
      "Datos de crecimiento: clientes nuevos y clientes activos por mes para un año dado.",
    parameters: z.object({
      year: z.number().describe("Año a consultar"),
    }),
    execute: async ({ year }) => getClientGrowthData(year),
  }),

  obtener_comparacion_anual: tool({
    description:
      "Compara datos financieros entre los últimos 3 años: ingresos anuales, clases mensuales y costo promedio. Úsala para tendencias o comparaciones año vs año.",
    parameters: z.object({}),
    execute: async () => getYearComparisonData(),
  }),

  obtener_balance_mensual: tool({
    description:
      "Balance detallado de un mes específico: lista de clientes con tarifa individual, horas y costo total, más el gran total del mes. Úsala para '¿cuánto gané en febrero?' o desglose mensual.",
    parameters: z.object({
      year: z.number().describe("Año"),
      month: z.number().min(1).max(12).describe("Mes (1=Enero, 12=Diciembre)"),
    }),
    execute: async ({ year, month }) => fetchMonthlyBalance(year, month),
  }),

  obtener_periodos_disponibles: tool({
    description:
      "Lista todos los periodos (año/mes) con balances registrados. Úsala primero si no sabes qué meses tienen datos.",
    parameters: z.object({}),
    execute: async () => getAvailableBalances(),
  }),
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { messages, provider = "claude" } = await req.json();

  const today = new Date();
  const systemPrompt = `Eres el asistente administrativo de Academia Dialéctica, un negocio de tutorías privadas en Bogotá. Hoy es ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}.

Tienes acceso a herramientas para consultar datos financieros y de clientes en tiempo real. Si el admin pregunta sobre ingresos, clases, balances o estadísticas de clientes, DEBES usar tus herramientas para obtener los datos reales antes de responder. Nunca adivines cifras financieras.

REGLAS:
- Responde siempre en español. Sé conciso y útil.
- Usa las herramientas disponibles para consultar datos. NUNCA inventes nombres, precios ni fechas.
- Si la información no está en los datos devueltos, di: "No tengo esa información en la base de datos."
- Cuando menciones montos, usa formato COP con separador de miles (ej: $1.200.000 COP).
- Cuando el usuario diga "este mes" o "el mes pasado", calcula el año y mes correcto basándote en la fecha actual.
- Cada clase dura 2 horas (clases = horas / 2).`;

  const result = streamText({
    model: getModel(provider as Provider),
    system: systemPrompt,
    messages,
    tools: chatTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
