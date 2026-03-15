export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Year nav skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div className="w-20 h-8 bg-gray-200 rounded" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* KPI section */}
      <div>
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-16 h-7 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-100">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-[300px] bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Matrix skeleton */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-[200px] bg-gray-100 rounded" />
      </div>

      {/* Growth chart skeleton */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-[300px] bg-gray-100 rounded" />
      </div>
    </div>
  );
}
