import { getTestimonials } from "@/lib/actions/testimonial-actions";
import { TestimonialTable } from "@/components/testimonial-table";

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Testimonios</h1>
      <TestimonialTable testimonials={testimonials} />
    </div>
  );
}
