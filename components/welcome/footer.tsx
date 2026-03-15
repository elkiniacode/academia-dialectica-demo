import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Academia Dialéctica"
            width={90}
            height={65}
            style={{ mixBlendMode: "screen" }}
          />
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Academia Dialéctica. Todos los
          derechos reservados.
        </p>
      </div>
    </footer>
  );
}
