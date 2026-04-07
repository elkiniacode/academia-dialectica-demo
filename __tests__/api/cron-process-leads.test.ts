import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

// Mock prisma
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: { findMany: (...args: unknown[]) => mockFindMany(...args), update: (...args: unknown[]) => mockUpdate(...args) },
    client: { findUnique: (...args: unknown[]) => mockFindUnique(...args), create: (...args: unknown[]) => mockCreate(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

// Mock email
const mockSendEmail = vi.fn();
vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

// Mock email templates
vi.mock("@/lib/email-templates", () => ({
  welcomeStudentEmail: () => "<html>mock email</html>",
}));

// Mock password
vi.mock("@/lib/password", () => ({
  hashPassword: async (pw: string) => `hashed_${pw}`,
}));

// Import AFTER mocks
const { POST } = await import("@/app/api/cron/process-leads/route");

function makeRequest(secret: string = "test-secret") {
  return new Request("http://localhost/api/cron/process-leads", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  }) as unknown as import("next/server").NextRequest;
}

describe("POST /api/cron/process-leads", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CRON_SECRET", "test-secret");
  });

  it("returns 401 for invalid auth token", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns empty results when no eligible leads", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.total).toBe(0);
    expect(body.processed).toBe(0);
    expect(body.results).toEqual([]);
  });

  it("processes a lead: sends email then creates client", async () => {
    const lead = {
      id: "lead-1",
      name: "Luis González",
      email: "luis@test.com",
      phone: "3001234567",
      characterClass: "mago",
      createdAt: new Date("2026-03-10"),
    };
    mockFindMany.mockResolvedValue([lead]);
    mockFindUnique.mockResolvedValue(null); // no username or name collision
    mockSendEmail.mockResolvedValue(undefined);
    mockTransaction.mockResolvedValue([{}, {}]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.total).toBe(1);
    expect(body.processed).toBe(1);
    expect(body.results[0].status).toBe("processed");

    // Email sent BEFORE DB write
    expect(mockSendEmail).toHaveBeenCalledBefore(mockTransaction);
    expect(mockSendEmail).toHaveBeenCalledWith(
      "luis@test.com",
      "¡Bienvenido a Academia Dialéctica!",
      expect.any(String),
    );
  });

  it("skips lead if client name already exists", async () => {
    const lead = {
      id: "lead-2",
      name: "Existing Client",
      email: "existing@test.com",
      characterClass: "guerrero",
      createdAt: new Date("2026-03-10"),
    };
    mockFindMany.mockResolvedValue([lead]);
    // First call: username check (no collision), second call: name check (collision!)
    mockFindUnique
      .mockResolvedValueOnce(null)        // username not taken
      .mockResolvedValueOnce({ id: "c1" }); // name exists

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results[0].status).toBe("skipped");
    expect(body.results[0].reason).toBe("client_name_exists");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("does not create client if email fails", async () => {
    const lead = {
      id: "lead-3",
      name: "Test User",
      email: "fail@test.com",
      characterClass: "explorador",
      createdAt: new Date("2026-03-10"),
    };
    mockFindMany.mockResolvedValue([lead]);
    mockFindUnique.mockResolvedValue(null);
    mockSendEmail.mockRejectedValue(new Error("SMTP error"));

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.processed).toBe(0);
    expect(body.results[0].status).toBe("error");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("generates collision-resistant username on duplicate", async () => {
    const lead = {
      id: "lead-4",
      name: "Ana María",
      email: "ana@test.com",
      characterClass: "guerrero",
      createdAt: new Date("2026-03-10"),
    };
    mockFindMany.mockResolvedValue([lead]);
    // First findUnique: username collision, second: no name collision
    mockFindUnique
      .mockResolvedValueOnce({ id: "existing" }) // username taken
      .mockResolvedValueOnce(null);               // name not taken
    mockSendEmail.mockResolvedValue(undefined);
    mockTransaction.mockResolvedValue([{}, {}]);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(body.results[0].status).toBe("processed");
  });
});
