"use client";

import type { RoadmapDay } from "@/lib/roadmaps";

type DayMetroLineProps = {
  days: RoadmapDay[];
  completedDays?: number[];
  currentDay?: number;
  onDayClick: (dayNumber: number) => void;
};

export function DayMetroLine({ days, completedDays = [], currentDay, onDayClick }: DayMetroLineProps) {
  return (
    <div className="metro-container">
      <svg className="metro-line-svg" viewBox="0 0 100 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--sage)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--sage)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Wavy metro line */}
        <path
          d={generateMetroPath(days.length)}
          stroke="url(#line-gradient)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          className="metro-path"
        />
      </svg>
      
      {/* Day stations */}
      <div className="metro-stations">
        {days.map((day, index) => {
          const isCompleted = completedDays.includes(day.dayNumber);
          const isCurrent = currentDay === day.dayNumber;
          const offsetLeft = index % 2 === 0 ? "20%" : "80%";
          const cardAlign = index % 2 === 0 ? "left" : "right";
          
          return (
            <div
              key={day.dayNumber}
              className="metro-station"
              style={{
                top: `${(index / (days.length - 1)) * 100}%`,
                left: offsetLeft,
              }}
            >
              {/* Station dot */}
              <button
                className={`metro-dot ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onDayClick(day.dayNumber)}
                aria-label={`День ${day.dayNumber}: ${day.title}`}
              >
                {isCompleted && <span className="check-icon">✓</span>}
                {isCurrent && !isCompleted && <span className="pulse-ring" />}
              </button>
              
              {/* Day card */}
              <button
                className={`metro-card ${cardAlign} ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onDayClick(day.dayNumber)}
              >
                <div className="metro-card-header">
                  <span className="day-number">День {day.dayNumber}</span>
                  {isCompleted && <span className="completed-badge">✓</span>}
                </div>
                <h3 className="day-title">{day.title}</h3>
                <div className="day-progress-ring">
                  <svg viewBox="0 0 36 36" className="progress-ring">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      opacity="0.2"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="100"
                      strokeDashoffset={isCompleted ? "0" : "100"}
                      className="progress-ring-circle"
                    />
                  </svg>
                  <span className="progress-percent">{isCompleted ? "100" : "0"}%</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Generate a smooth curved path that resembles a metro line
 */
function generateMetroPath(dayCount: number): string {
  const segments: string[] = [];
  const points = Math.max(2, dayCount);
  
  for (let i = 0; i < points; i++) {
    const y = (i / (points - 1)) * 800;
    // Alternate between left and right with smooth curves
    const x = 50 + Math.sin(i * 0.8) * 15;
    
    if (i === 0) {
      segments.push(`M ${x} ${y}`);
    } else {
      const prevY = ((i - 1) / (points - 1)) * 800;
      const prevX = 50 + Math.sin((i - 1) * 0.8) * 15;
      const midY = (prevY + y) / 2;
      
      // Use quadratic bezier curve for smooth waves
      segments.push(`Q ${prevX} ${midY}, ${x} ${y}`);
    }
  }
  
  return segments.join(" ");
}
