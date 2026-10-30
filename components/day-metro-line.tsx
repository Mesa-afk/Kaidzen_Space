"use client";

import type { RoadmapDay } from "@/lib/roadmaps";

type DayMetroLineProps = {
  days: RoadmapDay[];
  completedDays?: number[];
  currentDay?: number;
  dayProgress?: Record<number, number>; // dayNumber -> percentage
  onDayClick: (dayNumber: number) => void;
};

export function DayMetroLine({ days, completedDays = [], currentDay, dayProgress = {}, onDayClick }: DayMetroLineProps) {
  // Calculate container height based on day count: 140px per day minimum
  const containerHeight = Math.max(600, days.length * 140);
  const stationPositions = days.map((_, index) => ({
    top: index === 0 ? 70 : (index / (days.length - 1)) * (containerHeight - 140) + 70,
  }));
  
  return (
    <div className="metro-container" style={{ minHeight: `${containerHeight}px` }}>
      {/* Central vertical line */}
      <svg 
        className="metro-line-svg" 
        style={{ 
          position: "absolute",
          left: "50%",
          top: 0,
          width: "3px",
          height: "100%",
          transform: "translateX(-50%)",
          overflow: "visible",
          pointerEvents: "none",
        }}
      >
        <line
          x1="1.5"
          y1="0"
          x2="1.5"
          y2={containerHeight}
          stroke="var(--sage)"
          strokeWidth="3"
          strokeOpacity="0.35"
          strokeLinecap="round"
          className="metro-path"
        />
      </svg>
      
      {/* Day stations */}
      <div className="metro-stations" style={{ minHeight: `${containerHeight}px` }}>
        {days.map((day, index) => {
          const isCompleted = completedDays.includes(day.dayNumber);
          const isCurrent = currentDay === day.dayNumber;
          const progress = dayProgress[day.dayNumber] ?? 0;
          const cardAlign = index % 2 === 0 ? "left" : "right";
          const topPosition = stationPositions[index].top;
          
          return (
            <div
              key={day.dayNumber}
              className="metro-station"
              style={{
                position: "absolute",
                top: `${topPosition}px`,
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "auto",
                "--m3-stagger": Math.min(index, 10),
              } as React.CSSProperties}
            >
              {/* Station dot */}
              <button
                className={`metro-dot ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onDayClick(day.dayNumber)}
                aria-label={`День ${day.dayNumber}: ${day.title}`}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 10,
                }}
              >
                {isCompleted && <span className="check-icon">✓</span>}
                {isCurrent && !isCompleted && <span className="pulse-ring" />}
              </button>
              
              {/* Day card */}
              <button
                className={`metro-card ${cardAlign} ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                onClick={() => onDayClick(day.dayNumber)}
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  [cardAlign === "left" ? "right" : "left"]: "calc(50% + 50px)",
                  zIndex: 5,
                }}
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
                      strokeDashoffset={100 - progress}
                      className="progress-ring-circle"
                    />
                  </svg>
                  <span className="progress-percent">{progress}%</span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
