// src/components/StatsSection.tsx
import React from "react";
import { Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatTimeToMinutes } from "../utils/timeUtils";
import { Stats } from "../types";

interface StatsSectionProps {
  stats: Stats;
  completedPomodoros: number;
  totalFocusTime: number;
}

// No changes needed to the component itself as it already uses formatTimeToMinutes

const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  //   completedPomodoros,
  //   totalFocusTime,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Today</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Sessions
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stats.dailyPomodoros}</span>
              <span className="text-xs text-muted-foreground">pomodoros</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Focus Time
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {Math.floor(stats.dailyFocusTime / 60)}
              </span>
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>This Week</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Sessions
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {stats.weeklyPomodoros}
              </span>
              <span className="text-xs text-muted-foreground">pomodoros</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Focus Time
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {Math.floor(stats.weeklyFocusTime / 60)}
              </span>
              <span className="text-xs text-muted-foreground">minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;
