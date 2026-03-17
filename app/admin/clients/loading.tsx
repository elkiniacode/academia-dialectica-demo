export default function ClientsLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-gray-200 rounded-lg" />
          <div className="h-9 w-40 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-20" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-50">
            <div className="h-4 bg-gray-100 rounded w-28" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
