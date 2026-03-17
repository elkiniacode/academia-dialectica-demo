export default function ClientDashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
      {/* Character card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex items-center gap-6">
        <div className="w-32 h-32 bg-gray-200 rounded-xl" />
        <div className="space-y-3 flex-1">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
          {/* HP bar */}
          <div className="h-3 w-full bg-gray-100 rounded-full" />
          {/* XP bar */}
          <div className="h-3 w-full bg-gray-100 rounded-full" />
        </div>
      </div>

      {/* Exams list */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 space-y-4">
        <div className="h-5 w-28 bg-gray-200 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-6 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Progress notes */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 space-y-4">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border-l-4 border-gray-200 pl-4">
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Suggestion box */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 space-y-3">
        <div className="h-5 w-44 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-100 rounded" />
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
