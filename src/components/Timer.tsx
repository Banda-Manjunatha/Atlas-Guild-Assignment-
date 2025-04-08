// src/components/Timer.tsx
import React from "react";
import { Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

import { cn } from "../lib/utils";
import { TimerStatus, TimerType } from "../types";
import { formatTime } from "../utils/timeUtils";

interface TimerProps {
  currentTime: number;
  timerStatus: TimerStatus;
  timerType: TimerType;
  focusMode: boolean;
  workTime: number; // Add this
  breakTime: number; // Add this
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const Timer: React.FC<TimerProps> = ({
  currentTime,
  timerStatus,
  timerType,
  focusMode,
  workTime, // Add this
  breakTime, // Add this
  onStart,
  onPause,
  onReset,
}) => {
  // // Calculate progress percentage
  // const totalTime = timerType === "work" ? 25 * 60 : 5 * 60; // Default values for progress calculation
  // const progress = 100 - (currentTime / totalTime) * 100;

  const totalTime = timerType === "work" ? workTime : breakTime;
  const progress = 100 - (currentTime / totalTime) * 100;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-2xl",
        focusMode
          ? "bg-gradient-to-br from-gray-900 to-black border border-gray-800"
          : "bg-card border border-border"
      )}
    >
      <div className="w-64 h-64 relative flex items-center justify-center mb-6">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={focusMode ? "#333" : "#e5e7eb"}
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={
              timerType === "work"
                ? focusMode
                  ? "#60a5fa"
                  : "#3b82f6"
                : focusMode
                ? "#84cc16"
                : "#84cc16"
            }
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={Math.PI * 2 * 45}
            strokeDashoffset={Math.PI * 2 * 45 * (1 - progress / 100)}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={cn(
              "text-5xl font-bold",
              focusMode ? "text-white" : "",
              timerType === "work"
                ? focusMode
                  ? "text-blue-300"
                  : "text-blue-500"
                : focusMode
                ? "text-green-300"
                : "text-green-500"
            )}
          >
            {formatTime(currentTime)}
          </span>
          <span
            className={cn(
              "text-sm uppercase mt-2",
              focusMode ? "text-gray-400" : "text-gray-500"
            )}
          >
            {timerType === "work" ? "Focus" : "Break"}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        {timerStatus === "running" ? (
          <Button
            onClick={onPause}
            size="lg"
            className={cn(
              "px-8",
              timerType === "work"
                ? focusMode
                  ? "bg-blue-700 hover:bg-blue-800"
                  : ""
                : focusMode
                ? "bg-green-700 hover:bg-green-800"
                : ""
            )}
          >
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </Button>
        ) : (
          <Button
            onClick={onStart}
            size="lg"
            className={cn(
              "px-8",
              timerType === "work"
                ? focusMode
                  ? "bg-blue-700 hover:bg-blue-800"
                  : ""
                : focusMode
                ? "bg-green-700 hover:bg-green-800"
                : ""
            )}
          >
            <Play className="mr-2 h-5 w-5" />
            {timerStatus === "idle" ? "Start" : "Resume"}
          </Button>
        )}

        <Button
          onClick={onReset}
          variant="outline"
          size="icon"
          className={focusMode ? "border-gray-700 hover:bg-gray-800" : ""}
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Timer;
