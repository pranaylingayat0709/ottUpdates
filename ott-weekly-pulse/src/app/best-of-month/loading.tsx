export default function Loading() {
  return (
    <div>
      <div className="skeleton mb-2 h-9 w-72 rounded-lg" />
      <div className="skeleton mb-6 h-4 w-96 rounded" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
