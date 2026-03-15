import { NextRequest, NextResponse } from "next/server";
import { getLeadsByRange } from "@/lib/actions/lead-actions";
import { auth } from "@/lib/auth";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const from = parseInt(searchParams.get("from") || "0", 10);
  const to = parseInt(searchParams.get("to") || "0", 10);

  if (!from || !to || from < 1 || to < 1) {
    return NextResponse.json(
      { error: "Parámetros 'from' y 'to' son requeridos y deben ser mayores a 0." },
      { status: 400 }
    );
  }

  try {
    const leads = await getLeadsByRange(from, to);

    const header = "Número,Nombre,Email,Teléfono,Fecha";
    const rows = leads.map((lead) => {
      const date = lead.createdAt.toISOString().split("T")[0];
      return `${lead.number},${csvEscape(lead.name)},${csvEscape(lead.email)},${csvEscape(lead.phone || "")},${date}`;
    });

    const BOM = "\uFEFF";
    const csv = BOM + [header, ...rows].join("\n");

    const min = Math.min(from, to);
    const max = Math.max(from, to);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads_${min}_a_${max}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al descargar leads." },
      { status: 500 }
    );
  }
}
