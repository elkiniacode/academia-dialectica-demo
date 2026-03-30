"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/password";

export interface ClientResult {
  success: boolean;
  error?: string;
  username?: string;
}

export async function getClients() {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.client.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });
}

export async function getArchivedClients() {
  const session = await auth();
  if (!session || session.role !== "ADMIN") return [];

  return prisma.client.findMany({
    where: { archived: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createClient(formData: FormData): Promise<ClientResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  const name = formData.get("name")?.toString().trim();
  const hourlyRate = parseFloat(formData.get("hourlyRate")?.toString() ?? "");

  if (!name) return { success: false, error: "El nombre es obligatorio" };
  if (isNaN(hourlyRate) || hourlyRate < 0)
    return { success: false, error: "El costo por hora es inválido" };

  const existing = await prisma.client.findUnique({ where: { name } });
  if (existing)
    return { success: false, error: `Ya existe un cliente con el nombre "${name}"` };

  // Username uniqueness check
  const username = formData.get("username")?.toString().trim() || null;
  if (username) {
    const existingUsername = await prisma.client.findUnique({ where: { username } });
    if (existingUsername)
      return { success: false, error: `El usuario "${username}" ya está en uso` };
  }

  // Password validation and hashing (S3)
  const rawPassword = formData.get("password")?.toString() || null;
  let hashedPassword: string | null = null;
  if (rawPassword) {
    const passwordError = validatePassword(rawPassword);
    if (passwordError) return { success: false, error: passwordError };
    hashedPassword = await hashPassword(rawPassword);
  }

  await prisma.client.create({
    data: {
      name,
      hourlyRate,
      currency: "COP",
      student: formData.get("student")?.toString().trim() || null,
      modalidad: formData.get("modalidad")?.toString().trim() || null,
      grado: formData.get("grado")?.toString().trim() || null,
      celular: formData.get("celular")?.toString().trim() || null,
      direccion: formData.get("direccion")?.toString().trim() || null,
      correo: formData.get("correo")?.toString().trim() || null,
      username,
      password: hashedPassword,
    },
  });

  return { success: true };
}

export async function updateClient(
  id: string,
  formData: FormData
): Promise<ClientResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  const name = formData.get("name")?.toString().trim();
  const hourlyRate = parseFloat(formData.get("hourlyRate")?.toString() ?? "");

  if (!name) return { success: false, error: "El nombre es obligatorio" };
  if (isNaN(hourlyRate) || hourlyRate < 0)
    return { success: false, error: "El costo por hora es inválido" };

  // Check name uniqueness excluding current client
  const existing = await prisma.client.findFirst({
    where: { name, NOT: { id } },
  });
  if (existing)
    return { success: false, error: `Ya existe un cliente con el nombre "${name}"` };

  // Username uniqueness check
  const username = formData.get("username")?.toString().trim() || null;
  if (username) {
    const existingUsername = await prisma.client.findFirst({
      where: { username, NOT: { id } },
    });
    if (existingUsername)
      return { success: false, error: `El usuario "${username}" ya está en uso` };
  }

  // Password validation and hashing (S3) — only if a new password is provided
  const rawPassword = formData.get("password")?.toString() || null;
  let hashedPassword: string | undefined;
  if (rawPassword) {
    const passwordError = validatePassword(rawPassword);
    if (passwordError) return { success: false, error: passwordError };
    hashedPassword = await hashPassword(rawPassword);
  }

  await prisma.client.update({
    where: { id },
    data: {
      name,
      hourlyRate,
      currency: "COP",
      student: formData.get("student")?.toString().trim() || null,
      modalidad: formData.get("modalidad")?.toString().trim() || null,
      grado: formData.get("grado")?.toString().trim() || null,
      celular: formData.get("celular")?.toString().trim() || null,
      direccion: formData.get("direccion")?.toString().trim() || null,
      correo: formData.get("correo")?.toString().trim() || null,
      username,
      ...(hashedPassword !== undefined && { password: hashedPassword }),
    },
  });

  return { success: true };
}

export interface BulkCreateResult {
  success: boolean;
  created: number;
  skipped: { name: string; reason: string }[];
  error?: string;
}

export async function bulkCreateClients(
  clients: Array<{
    name: string;
    hourlyRate: number;
    student?: string | null;
    modalidad?: string | null;
    grado?: string | null;
    celular?: string | null;
    correo?: string | null;
    direccion?: string | null;
  }>
): Promise<BulkCreateResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, created: 0, skipped: [], error: "No autorizado" };

  if (!clients.length) return { success: false, created: 0, skipped: [], error: "No hay clientes para importar" };

  const skipped: { name: string; reason: string }[] = [];
  const valid: typeof clients = [];

  // Validate and dedupe within batch
  const seenNames = new Set<string>();
  for (const c of clients) {
    const name = c.name?.trim();
    if (!name) {
      skipped.push({ name: "(sin nombre)", reason: "El nombre es obligatorio" });
      continue;
    }
    if (isNaN(c.hourlyRate) || c.hourlyRate < 0) {
      skipped.push({ name, reason: "El costo por hora es inválido" });
      continue;
    }
    const lower = name.toLowerCase();
    if (seenNames.has(lower)) {
      skipped.push({ name, reason: "Nombre duplicado en el lote" });
      continue;
    }
    seenNames.add(lower);
    valid.push({ ...c, name });
  }

  // Check existing names in DB
  const existingClients = await prisma.client.findMany({ select: { name: true } });
  const existingNames = new Set(existingClients.map((e) => e.name.toLowerCase()));

  const toCreate: typeof valid = [];
  for (const c of valid) {
    if (existingNames.has(c.name.toLowerCase())) {
      skipped.push({ name: c.name, reason: "Ya existe un cliente con este nombre" });
    } else {
      toCreate.push(c);
    }
  }

  if (toCreate.length === 0) {
    return { success: true, created: 0, skipped };
  }

  await prisma.$transaction(
    toCreate.map((c) =>
      prisma.client.create({
        data: {
          name: c.name,
          hourlyRate: c.hourlyRate,
          currency: "COP",
          student: c.student?.trim() || null,
          modalidad: c.modalidad?.trim() || null,
          grado: c.grado?.trim() || null,
          celular: c.celular?.trim() || null,
          direccion: c.direccion?.trim() || null,
          correo: c.correo?.trim() || null,
        },
      })
    )
  );

  return { success: true, created: toCreate.length, skipped };
}

export async function deleteClient(id: string): Promise<ClientResult> {
  const session = await auth();
  if (!session || session.role !== "ADMIN")
    return { success: false, error: "No autorizado" };

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: { select: { sessions: true, balanceEntries: true } },
    },
  });

  if (!client) return { success: false, error: "Cliente no encontrado" };

  const hasBalanceHistory = client._count.balanceEntries > 0;

  if (hasBalanceHistory) {
    // Archive: wipe all personal data but keep the record for balance history
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { clientId: id } }),
      prisma.exam.deleteMany({ where: { clientId: id } }),
      prisma.progressNote.deleteMany({ where: { clientId: id } }),
      prisma.suggestion.deleteMany({ where: { clientId: id } }),
      prisma.client.update({
        where: { id },
        data: {
          archived: true,
          student: null,
          modalidad: null,
          grado: null,
          celular: null,
          direccion: null,
          correo: null,
          username: null,
          password: null,
          requirePasswordChange: false,
          hp: 100,
          xp: 0,
          level: 1,
          characterName: null,
          characterClass: null,
        },
      }),
    ]);
  } else {
    // No balance history — hard delete everything
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { clientId: id } }),
      prisma.exam.deleteMany({ where: { clientId: id } }),
      prisma.progressNote.deleteMany({ where: { clientId: id } }),
      prisma.suggestion.deleteMany({ where: { clientId: id } }),
      prisma.client.delete({ where: { id } }),
    ]);
  }

  return { success: true };
}

export async function changePassword(
  newPassword: string
): Promise<ClientResult> {
  const session = await auth();
  if (!session || session.role !== "CLIENT" || !session.userId)
    return { success: false, error: "No autorizado" };

  const validationError = validatePassword(newPassword);
  if (validationError) return { success: false, error: validationError };

  const hashed = await hashPassword(newPassword);

  const updated = await prisma.client.update({
    where: { id: session.userId },
    data: { password: hashed, requirePasswordChange: false },
    select: { username: true },
  });

  return { success: true, username: updated.username ?? undefined };
}

export async function updateUsername(
  newUsername: string
): Promise<ClientResult> {
  const session = await auth();
  if (!session || session.role !== "CLIENT" || !session.userId)
    return { success: false, error: "No autorizado" };

  const username = newUsername.trim().toLowerCase();
  if (!username || username.length < 3)
    return { success: false, error: "El usuario debe tener al menos 3 caracteres" };

  try {
    await prisma.client.update({
      where: { id: session.userId },
      data: { username },
    });
    return { success: true };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Ese nombre de usuario ya está en uso" };
    }
    return { success: false, error: "Error al actualizar el usuario" };
  }
}
