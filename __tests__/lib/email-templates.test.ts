import { describe, it, expect } from "vitest";
import { welcomeStudentEmail } from "@/lib/email-templates";

describe("welcomeStudentEmail", () => {
  const baseParams = {
    name: "Carlos Pérez",
    username: "carlosperez123",
    password: "Solroca42",
    characterClass: "guerrero",
    siteUrl: "https://academiadialectica.com",
  };

  it("returns valid HTML with DOCTYPE", () => {
    const html = welcomeStudentEmail(baseParams);
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("</html>");
  });

  it("includes the student name in greeting", () => {
    const html = welcomeStudentEmail(baseParams);
    expect(html).toContain("Carlos Pérez");
  });

  it("includes username and password in credentials card", () => {
    const html = welcomeStudentEmail(baseParams);
    expect(html).toContain("carlosperez123");
    expect(html).toContain("Solroca42");
  });

  it("maps character class to Spanish label", () => {
    expect(welcomeStudentEmail({ ...baseParams, characterClass: "guerrero" })).toContain("Guerrero");
    expect(welcomeStudentEmail({ ...baseParams, characterClass: "mago" })).toContain("Mago");
    expect(welcomeStudentEmail({ ...baseParams, characterClass: "explorador" })).toContain("Explorador");
  });

  it("falls back to raw class name for unknown classes", () => {
    const html = welcomeStudentEmail({ ...baseParams, characterClass: "ninja" });
    expect(html).toContain("ninja");
  });

  it("includes login CTA link with siteUrl", () => {
    const html = welcomeStudentEmail(baseParams);
    expect(html).toContain('href="https://academiadialectica.com/login"');
  });

  it("includes logo image with siteUrl", () => {
    const html = welcomeStudentEmail(baseParams);
    expect(html).toContain('src="https://academiadialectica.com/logo.png"');
  });

  it("strips protocol from siteUrl in footer", () => {
    const html = welcomeStudentEmail(baseParams);
    // Footer shows domain without https:// as link text
    expect(html).toContain(">academiadialectica.com</a>");
  });
});
