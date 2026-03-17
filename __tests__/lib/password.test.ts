import { describe, it, expect } from "vitest";
import { validatePassword, hashPassword, verifyPassword } from "@/lib/password";

describe("validatePassword", () => {
  it("accepts a valid password with letters and numbers", () => {
    expect(validatePassword("abcde123")).toBeNull();
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("abc1")).not.toBeNull();
    expect(validatePassword("abc1")).toContain("8 caracteres");
  });

  it("rejects weak-list passwords (case-insensitive)", () => {
    expect(validatePassword("password1")).toContain("débil");
    expect(validatePassword("Password1")).toContain("débil");
    expect(validatePassword("contraseña")).toContain("débil");
  });

  it("rejects all-same-character passwords", () => {
    expect(validatePassword("aaaaaaaa")).toContain("débil");
    expect(validatePassword("11111111")).toContain("débil");
  });

  it("rejects letters-only passwords", () => {
    expect(validatePassword("abcdefgh")).toContain("letra y un número");
  });

  it("rejects digits-only passwords", () => {
    // "12345678" is in the weak list, so use a different digits-only string
    expect(validatePassword("98765432")).toContain("letra y un número");
  });

  it("accepts passwords with Spanish ñ", () => {
    expect(validatePassword("señor1234")).toBeNull();
  });

  it("accepts passwords with accented characters", () => {
    expect(validatePassword("máquina99")).toBeNull();
    expect(validatePassword("cólera123")).toBeNull();
  });

  it("trims whitespace before validation", () => {
    expect(validatePassword("  abcde123  ")).toBeNull();
  });

  it("trims whitespace — short after trim is rejected", () => {
    expect(validatePassword("   abc1   ")).not.toBeNull();
  });
});

describe("hashPassword / verifyPassword", () => {
  it("round-trips correctly", async () => {
    const hash = await hashPassword("mipass123");
    expect(await verifyPassword("mipass123", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("mipass123");
    expect(await verifyPassword("wrongpass1", hash)).toBe(false);
  });

  it("trims whitespace consistently", async () => {
    const hash = await hashPassword("  mipass123  ");
    expect(await verifyPassword("mipass123", hash)).toBe(true);
    expect(await verifyPassword("  mipass123  ", hash)).toBe(true);
  });
});
