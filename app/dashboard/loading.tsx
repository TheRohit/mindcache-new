function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-muted-foreground/10 ${className ?? ""}`}
    />
  );
}

function CardSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-none border-2 border-border/40 bg-card/60">
      {tall && <Bone className="h-40 w-full rounded-none" />}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-16" />
          <Bone className="h-5 w-5" />
        </div>
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
        <Bone className="mt-1 h-3 w-1/3 border-t border-border/30 pt-1" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-col items-center gap-12 px-4 py-16 sm:px-6 sm:py-12">
      <div className="flex w-full flex-col items-center gap-8">
        {/* Greeting */}
        <Bone className="h-10 w-80 lg:h-12" />

        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          {/* Composer */}
          <div className="mb-6 flex justify-center items-center">
            <div className="w-full max-w-2xl rounded-none border-2 border-border/40 bg-card/60 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <Bone className="mb-3 h-20 w-full" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bone className="h-7 w-16" />
                  <Bone className="h-7 w-14" />
                </div>
                <Bone className="h-8 w-16" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-8">
            <div className="flex items-center gap-2 rounded-none border-2 border-border/40 bg-card/60 p-2 pl-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
              <Bone className="h-4 w-4 shrink-0" />
              <Bone className="h-10 flex-1" />
              <Bone className="h-9 w-20" />
            </div>
          </div>

          {/* Memory count */}
          <div className="mb-6">
            <Bone className="h-4 w-32" />
          </div>

          {/* Card grid */}
          <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton tall />
            </div>
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton tall />
            </div>
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton />
            </div>
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton />
            </div>
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton tall />
            </div>
            <div className="mb-6 break-inside-avoid">
              <CardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
