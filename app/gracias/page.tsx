import Link from "next/link";

export const metadata = {
  title: "¡Registro Exitoso! — Academia Dialéctica",
  description: "Hemos recibido tus datos. Pronto nos pondremos en contacto contigo.",
  robots: { index: false },
};

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
          ✓
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">
          ¡Registro Exitoso!
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Tus datos han sido enviados. Nos pondremos en contacto contigo muy pronto.
        </p>
        <Link
          href="/"
          className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-600/30"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
