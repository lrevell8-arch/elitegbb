import * as React from "react"
import { cn } from "@/lib/utils"

const WatermarkOverlay = React.forwardRef(({ 
  className, 
  children, 
  isFreeTier = false,
  watermarkText = "FREE",
  showBadge = true,
  ...props 
}, ref) => {
  if (!isFreeTier) {
    return children;
  }

  return (
    <div 
      ref={ref}
      className={cn("relative inline-block", className)}
      {...props}
    >
      {children}
      
      {/* Diagonal watermark text overlay */}
      <div 
        className="absolute inset-0 overflow-hidden rounded-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ 
            transform: 'rotate(-45deg)',
          }}
        >
          <span 
            className="text-[8px] sm:text-[10px] font-bold tracking-wider text-white/60 whitespace-nowrap"
            style={{ 
              textShadow: '0 0 4px rgba(143, 51, 230, 0.8), 0 0 8px rgba(143, 51, 230, 0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {watermarkText}
          </span>
        </div>
      </div>

      {/* Corner badge */}
      {showBadge && (
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #8f33e6 0%, #fb6c1d 100%)',
            zIndex: 20,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <svg 
            width="8" 
            height="8" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      )}

      {/* Subtle border glow for free tier */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none border-2 border-dashed border-[#8f33e6]/40"
        style={{ zIndex: 5 }}
      />
    </div>
  )
})
WatermarkOverlay.displayName = "WatermarkOverlay"

export { WatermarkOverlay }
