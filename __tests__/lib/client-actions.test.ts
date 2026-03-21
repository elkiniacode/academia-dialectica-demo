import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockSession = { role: "CLIENT", userId: "client-123" };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => mockSession),
}));

const mockUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    client: {
      update: (...args: unknown[]) => mockUpdate(...args),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    session: {
      findMany: vi.fn(async () => []),
    },
    monthlyBalance: {
      findMany: vi.fn(async () => []),
    },
  },
}));

vi.mock("@/lib/password", () => ({
  validatePassword: (pw: string) => {
    if (pw.length < 8) return "Mínimo 8 caracteres";
    if (!/[a-zA-Z]/.test(pw)) return "Debe contener una letra";
    if (!/[0-9]/.test(pw)) return "Debe contener un número";
    return null;
  },
  hashPassword: async (pw: string) => `hashed_${pw}`,
  verifyPassword: async () => true,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const { changePassword, updateUsername } = await import("@/lib/actions/client-actions");
const { auth } = await import("@/lib/auth");

describe("changePassword", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    mockUpdate.mockResolvedValue({});
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await changePassword("Newpass123");
    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("rejects ADMIN role", async () => {
    vi.mocked(auth).mockResolvedValue({ role: "ADMIN", userId: "a1" } as any);
    const result = await changePassword("Newpass123");
    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("rejects weak password", async () => {
    const result = await changePassword("short1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("8");
  });

  it("rejects password without number", async () => {
    const result = await changePassword("abcdefgh");
    expect(result.success).toBe(false);
  });

  it("rejects password without letter", async () => {
    const result = await changePassword("12345678");
    expect(result.success).toBe(false);
  });

  it("updates password and clears requirePasswordChange", async () => {
    mockUpdate.mockResolvedValue({ username: "testuser" });
    const result = await changePassword("Newpass123");
    expect(result).toEqual({ success: true, username: "testuser" });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "client-123" },
      data: { password: "hashed_Newpass123", requirePasswordChange: false },
      select: { username: true },
    });
  });

  it("uses session.userId (IDOR protection)", async () => {
    await changePassword("Secure99x");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "client-123" } }),
    );
  });
});

describe("updateUsername", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession as any);
    mockUpdate.mockResolvedValue({});
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await updateUsername("newuser");
    expect(result).toEqual({ success: false, error: "No autorizado" });
  });

  it("rejects username shorter than 3 chars", async () => {
    const result = await updateUsername("ab");
    expect(result.success).toBe(false);
    expect(result.error).toContain("3");
  });

  it("rejects empty username", async () => {
    const result = await updateUsername("   ");
    expect(result.success).toBe(false);
  });

  it("trims and lowercases username", async () => {
    await updateUsername("  MyUser  ");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "client-123" },
      data: { username: "myuser" },
    });
  });

  it("handles P2002 duplicate key error", async () => {
    mockUpdate.mockRejectedValue({ code: "P2002" });
    const result = await updateUsername("takenuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain("uso");
  });

  it("handles generic errors", async () => {
    mockUpdate.mockRejectedValue(new Error("DB down"));
    const result = await updateUsername("validuser");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error");
  });

  it("returns success for valid username", async () => {
    const result = await updateUsername("newuser123");
    expect(result).toEqual({ success: true });
  });
});
