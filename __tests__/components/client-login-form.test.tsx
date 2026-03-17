import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientLoginForm } from "@/components/client-login-form";

// --- Mocks ---

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
}));

const mockSignIn = vi.fn();
const mockUpdate = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  useSession: () => ({ update: mockUpdate }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Default: signIn succeeds
  mockSignIn.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue(undefined);
});

// Helper to mock the /api/auth/session fetch
function mockSessionFetch(session: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve(session),
    })
  );
}

describe("ClientLoginForm", () => {
  it("renders username and password fields", () => {
    mockSessionFetch({});
    render(<ClientLoginForm />);
    expect(screen.getByLabelText("Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
  });

  it("renders the login button", () => {
    mockSessionFetch({});
    render(<ClientLoginForm />);
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" })
    ).toBeInTheDocument();
  });

  it("redirects ADMIN to /admin/balance with current year/month", async () => {
    mockSessionFetch({ role: "ADMIN" });
    render(<ClientLoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "admin");
    await user.type(screen.getByLabelText("Contraseña"), "pass1234");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/admin/balance")
      );
    });
  });

  it("redirects CLIENT to /client/dashboard", async () => {
    mockSessionFetch({ role: "CLIENT" });
    render(<ClientLoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "student");
    await user.type(screen.getByLabelText("Contraseña"), "pass1234");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/client/dashboard");
    });
  });

  it("shows error message on failed login", async () => {
    mockSessionFetch({});
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
    render(<ClientLoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "wrong");
    await user.type(screen.getByLabelText("Contraseña"), "wrong");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Usuario o contraseña incorrectos"
      );
    });
  });

  it("calls router.refresh after successful login", async () => {
    mockSessionFetch({ role: "CLIENT" });
    render(<ClientLoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Usuario"), "student");
    await user.type(screen.getByLabelText("Contraseña"), "pass1234");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
