export default function MerchantLoading() {
  return (
    <div className="pt-20 lg:pt-8 pb-12 px-6 lg:px-12 space-y-10 lg:space-y-12">

      {/* Welcome skeleton */}
      <div className="space-y-2 pt-4">
        <div className="h-3 w-20 bg-[#1a1919] rounded-full animate-pulse" />
        <div className="h-10 w-56 bg-[#1a1919] rounded-xl animate-pulse" />
      </div>

      {/* Mobile: button + stat grid */}
      <div className="lg:hidden space-y-4">
        <div className="h-14 w-full bg-[#1a1919] rounded-full animate-pulse" />
        <div className="h-28 w-full bg-[#1a1919] rounded-2xl animate-pulse" />
      </div>

      {/* Desktop: QR card + 3 stat cards */}
      <div className="hidden lg:grid grid-cols-12 gap-8">
        <div className="col-span-4 h-[180px] bg-[#1a1919] rounded-[2rem] animate-pulse" />
        <div className="col-span-8 grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[180px] bg-[#1a1919] rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-36 bg-[#1a1919] rounded-lg animate-pulse" />
        <div className="bg-[#1a1919] rounded-[2rem] overflow-hidden">
          <div className="h-12 border-b border-[#494847]/10 bg-[#201f1f]/50" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 border-b border-white/5 px-8 flex items-center gap-6">
              <div className="h-3 bg-[#262626] rounded-full w-32 animate-pulse" style={{ animationDelay: `${i * 75}ms` }} />
              <div className="h-3 bg-[#262626] rounded-full w-48 animate-pulse" style={{ animationDelay: `${i * 75 + 25}ms` }} />
              <div className="h-5 bg-[#262626] rounded-full w-16 animate-pulse" style={{ animationDelay: `${i * 75 + 50}ms` }} />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
