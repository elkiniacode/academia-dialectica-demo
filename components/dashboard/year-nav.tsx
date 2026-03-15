"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  year: number;
}

export function YearNav({ year }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newYear: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(newYear));
    router.push(`/admin/dashboard?${params}`);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => navigate(year - 1)}
        className="text-gray-500 hover:text-gray-800 text-lg font-bold"
      >
        ←
      </button>
      <span className="text-2xl font-bold text-gray-800">{year}</span>
      <button
        onClick={() => navigate(year + 1)}
        className="text-gray-500 hover:text-gray-800 text-lg font-bold"
      >
        →
      </button>
    </div>
  );
}
