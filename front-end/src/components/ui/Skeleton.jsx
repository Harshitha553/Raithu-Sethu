// Skeleton loading placeholders
export function SkeletonLine({ width = "w-full", height = "h-4" }) {
  return <div className={`skeleton ${width} ${height}`} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-3/4" height="h-4" />
          <SkeletonLine width="w-1/2" height="h-3" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i % 2 === 0 ? "w-full" : "w-4/5"} />
      ))}
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      {[70, 50, 60, 40, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`skeleton h-4 rounded`} style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="table-wrapper animate-fade-in">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="flex justify-between">
            <SkeletonLine width="w-1/2" height="h-3" />
            <div className="skeleton w-9 h-9 rounded-xl" />
          </div>
          <SkeletonLine width="w-2/3" height="h-7" />
          <SkeletonLine width="w-1/3" height="h-3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCropCards({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="skeleton h-40 rounded-none" />
          <div className="p-4 space-y-2">
            <SkeletonLine width="w-2/3" height="h-4" />
            <SkeletonLine width="w-1/2" height="h-3" />
            <SkeletonLine width="w-full" height="h-3" />
            <div className="flex gap-2 mt-3">
              <div className="skeleton h-8 rounded-lg flex-1" />
              <div className="skeleton h-8 rounded-lg flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonCard;
