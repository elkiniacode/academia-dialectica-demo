import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockCreate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    publicFeedback: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

const { createPublicFeedback } = await import("@/lib/actions/feedback-actions");

describe("createPublicFeedback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCreate.mockResolvedValue({});
  });

  it("rejects invalid type", async () => {
    const result = await createPublicFeedback({ type: "INVALID" as any });
    expect(result.success).toBe(false);
    expect(result.error).toContain("inválido");
  });

  it("rejects GAME_RATING without rating", async () => {
    const result = await createPublicFeedback({ type: "GAME_RATING", message: "Great!" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("calificación");
  });

  it("rejects GAME_RATING with rating out of range", async () => {
    const result = await createPublicFeedback({ type: "GAME_RATING", rating: 6 });
    expect(result.success).toBe(false);
    expect(result.error).toContain("calificación");
  });

  it("rejects feedback with no message and no rating", async () => {
    const result = await createPublicFeedback({ type: "GENERAL_IDEA" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("mensaje o una calificación");
  });

  it("rejects message over 2000 characters", async () => {
    const result = await createPublicFeedback({
      type: "GENERAL_ISSUE",
      message: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("demasiado largo");
  });

  it("trims and lowercases input fields", async () => {
    const result = await createPublicFeedback({
      type: "GENERAL_IDEA",
      message: "  Add dark mode  ",
      email: "  Test@Email.COM  ",
    });
    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        type: "GENERAL_IDEA",
        rating: null,
        message: "Add dark mode",
        email: "test@email.com",
        page: "/",
      },
    });
  });

  it("creates GAME_RATING feedback with rating and message", async () => {
    const result = await createPublicFeedback({
      type: "GAME_RATING",
      rating: 4,
      message: "Fun game!",
      page: "/game",
    });
    expect(result.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        type: "GAME_RATING",
        rating: 4,
        message: "Fun game!",
        email: null,
        page: "/game",
      },
    });
  });

  it("returns error when prisma throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreate.mockRejectedValue(new Error("DB down"));

    const result = await createPublicFeedback({
      type: "GENERAL_ISSUE",
      message: "Something broke",
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Error interno");
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
