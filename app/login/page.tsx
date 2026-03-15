import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { ClientLoginForm } from "@/components/client-login-form";

export default async function LoginPage() {
  const session = await auth();

  const now = new Date();
  const adminTargetUrl = `/admin/balance?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;

  if (session) {
    if (session.role === "ADMIN") {
      redirect(adminTargetUrl);
    }
    redirect("/client/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Client login */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Portal del Estudiante</h1>
          <p className="text-gray-600 mb-6">
            Ingresa con tu usuario y contraseña
          </p>
        </div>
        <div className="flex justify-center">
          <ClientLoginForm />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">
              Administrador
            </span>
          </div>
        </div>

        {/* Admin Google login */}
        <div className="text-center">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: adminTargetUrl });
            }}
          >
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Iniciar sesión con Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
