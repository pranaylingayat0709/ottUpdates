export function HeroSkeleton() {
  return (
    <div className="relative -mx-4 mb-10 overflow-hidden sm:-mx-6 lg:-mx-8">
      <div className="mb-4 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="skeleton h-7 w-56 rounded-lg" />
      </div>
      <div className="mx-4 aspect-[16/10] overflow-hidden rounded-3xl sm:mx-6 sm:aspect-[21/9] lg:mx-8">
        <div className="skeleton h-full w-full" />
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        <div className="skeleton h-1.5 w-6 rounded-full" />
        <div className="skeleton h-1.5 w-1.5 rounded-full" />
        <div className="skeleton h-1.5 w-1.5 rounded-full" />
      </div>
    </div>
  );
}
