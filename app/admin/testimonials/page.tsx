import { auth } from "@/lib/auth";
import { getTestimonials } from "@/lib/actions/testimonial-actions";
import { TestimonialTable } from "@/components/testimonial-table";

export default async function TestimonialsPage() {
  const session = await auth();
  const testimonials = await getTestimonials();
  // Demo admin (credentials-based ADMIN) has userId set; real admin (Google OAuth) does not
  const readOnly = !!session?.userId;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Testimonios</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        Los testimonios aparecen en la{" "}
        <span className="font-medium text-gray-700">página principal</span>{" "}
        con estrellas y la opinión de cada familia. Cuantos más testimonios
        tengas, mayor credibilidad genera tu academia. Puedes controlar cuáles
        están visibles al público sin tener que eliminarlos.
      </p>
      {readOnly && (
        <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          Modo demo: solo lectura. No puedes agregar, editar ni eliminar testimonios.
        </p>
      )}
      <TestimonialTable testimonials={testimonials} readOnly={readOnly} />
    </div>
  );
}
