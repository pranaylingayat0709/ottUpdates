export default function Loading() {
  return (
    <div>
      <div className="skeleton mb-2 h-9 w-64 rounded-lg" />
      <div className="skeleton mb-8 h-4 w-80 rounded" />
      {[0, 1].map((section) => (
        <div key={section} className="mb-10">
          <div className="skeleton mb-4 h-6 w-32 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] w-24 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
