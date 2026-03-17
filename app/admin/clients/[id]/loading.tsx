export default function ClientDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-24 bg-gray-200 rounded" />

      {/* Client header */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-gray-200 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Panels */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-100 space-y-4">
          <div className="h-5 w-36 bg-gray-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-4 w-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded flex-1" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
