"use client";

import { useState } from "react";

export function LeadsDownload({ maxNumber }: { maxNumber: number }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const clamp = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || value === "") return "";
    return String(Math.max(1, Math.min(num, maxNumber)));
  };

  const handleDownloadRange = () => {
    const fromNum = parseInt(from, 10);
    const toNum = parseInt(to, 10);
    if (!fromNum || !toNum || fromNum < 1 || toNum < 1) return;
    window.location.href = `/api/leads/download?from=${fromNum}&to=${toNum}`;
  };

  const handleDownloadAll = () => {
    window.location.href = `/api/leads/download?from=1&to=${maxNumber}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <label htmlFor="lead-from" className="text-sm text-gray-600 font-medium">
        Descargar del
      </label>
      <input
        id="lead-from"
        type="number"
        min={1}
        max={maxNumber}
        placeholder="Desde"
        value={from}
        onChange={(e) => setFrom(clamp(e.target.value))}
        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <label htmlFor="lead-to" className="text-sm text-gray-600 font-medium">
        al
      </label>
      <input
        id="lead-to"
        type="number"
        min={1}
        max={maxNumber}
        placeholder="Hasta"
        value={to}
        onChange={(e) => setTo(clamp(e.target.value))}
        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleDownloadRange}
        disabled={!from || !to}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Descargar CSV
      </button>
      <button
        onClick={handleDownloadAll}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Descargar Todo
      </button>
    </div>
  );
}
