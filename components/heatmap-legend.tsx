export default function HeatmapLegend({ show }: { show: boolean }) {
    if (!show) return null
    return (
      <div className="flex items-center ml-4">
        <span className="text-xs mr-1">Low</span>
        <div className="h-2 w-28 bg-gradient-to-r from-[#0015ff] via-[#00e5ff] via-60% via-[#ffff00] via-80% to-[#ff0000] rounded" />
        <span className="text-xs ml-1">High</span>
      </div>
    )
  }

  