import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Logo + tagline */}
          <div>
            <Image
              src="/logo.png"
              alt="Academia Dialéctica"
              width={90}
              height={65}
            />
            <p className="text-sm mt-3">
              Tutoría personalizada para alcanzar tus metas académicas.
            </p>
          </div>

          {/* Column 2: Nav links */}
          <div>
            <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">
              Navegación
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="#caracteristicas"
                  className="inline-block transition-all duration-300 ease-out hover:text-white hover:translate-x-1"
                >
                  Características
                </a>
              </li>
              <li>
                <a
                  href="#modalidades"
                  className="inline-block transition-all duration-300 ease-out hover:text-white hover:translate-x-1"
                >
                  Modalidades
                </a>
              </li>
              <li>
                <a
                  href="#testimonios"
                  className="inline-block transition-all duration-300 ease-out hover:text-white hover:translate-x-1"
                >
                  Testimonios
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-white font-bold tracking-widest uppercase text-sm mb-4">
              Contacto
            </h4>
            <p className="text-sm">Bogotá, Colombia</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} Academia Dialéctica. Todos los
          derechos reservados.
        </div>
      </div>
    </footer>
  );
}
