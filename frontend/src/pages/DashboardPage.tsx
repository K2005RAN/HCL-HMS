export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome to HeidelbergCement India HMS</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 dark:bg-slate-800">
            <dt className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">Total Patients</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">1,24{i}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
