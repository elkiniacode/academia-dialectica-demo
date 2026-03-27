import { getTestimonials } from "@/lib/actions/testimonial-actions";
import { TestimonialTable } from "@/components/testimonial-table";

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <h1 className="text-2xl font-bold mb-2">Testimonios</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-3xl">
        Los testimonios aparecen en la{" "}
        <span className="font-medium text-gray-700">página principal</span>{" "}
        con estrellas y la opinión de cada familia. Cuantos más testimonios
        tengas, mayor credibilidad genera tu academia. Puedes controlar cuáles
        están visibles al público sin tener que eliminarlos.
      </p>
      <TestimonialTable testimonials={testimonials} readOnly={false} />
    </div>
  );
}
