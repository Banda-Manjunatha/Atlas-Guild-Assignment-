// App.tsx
import { useState, useEffect } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import Header from "./components/Header";
import Timer from "./components/Timer";
import TaskList from "./components/TaskList";
import StatsSection from "./components/StatsSection";
import FocusModeToggle from "./components/FocusModeToggle";
import { Task, TimerStatus, TimerType } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";

const DEFAULT_WORK_TIME = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes in seconds

function App() {
  const { toast } = useToast();
  const [tasks, setTasks] = useLocalStorage<Task[]>("focusflow-tasks", []);
  const [workTime, setWorkTime] = useLocalStorage(
    "work-time",
    DEFAULT_WORK_TIME
  );
  const [breakTime, setBreakTime] = useLocalStorage(
    "break-time",
    DEFAULT_BREAK_TIME
  );
  const [currentTime, setCurrentTime] = useState(workTime);
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [stats, setStats] = useLocalStorage("focus-stats", {
    dailyPomodoros: 0,
    weeklyPomodoros: 0,
    dailyFocusTime: 0,
    weeklyFocusTime: 0,
    lastResetDate: new Date().toISOString(),
  });

  // In App.tsx, modify the useEffect for the timer countdown
  useEffect(() => {
    let interval: number | null = null;
    const minuteInterval: number | null = null;
    let secondsCounted = 0;

    if (timerStatus === "running") {
      interval = window.setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            clearInterval(minuteInterval!);
            handleTimerComplete();
            return 0;
          }

          secondsCounted++;
          // Track every minute (60 seconds)
          if (secondsCounted % 60 === 0 && timerType === "work") {
            setTotalFocusTime((prev) => prev + 60);
            const minutesFocused = secondsCounted / 60;
            console.log(`✅ ${minutesFocused} min focused!`);
            setStats((prev) => ({
              ...prev,
              dailyFocusTime: prev.dailyFocusTime + 60,
              weeklyFocusTime: prev.weeklyFocusTime + 60,
            }));
          }

          return prevTime - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
      clearInterval(minuteInterval!);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (minuteInterval) clearInterval(minuteInterval);
    };
  }, [timerStatus]);

  // Remove the focus time tracking from handleWorkSessionComplete
  const handleWorkSessionComplete = () => {
    setCompletedPomodoros((prev) => prev + 1);

    // Update stats (only pomodoros, focus time is now tracked per minute)
    setStats((prev) => ({
      ...prev,
      dailyPomodoros: prev.dailyPomodoros + 1,
      weeklyPomodoros: prev.weeklyPomodoros + 1,
    }));

    // Update task progress if a task is active
    if (activeTaskId) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeTaskId
            ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
            : task
        )
      );
    }
  };

  // Check and reset daily/weekly stats
  useEffect(() => {
    const lastReset = new Date(stats.lastResetDate);
    const now = new Date();
    const isNewDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    const isNewWeek =
      now.getDay() < lastReset.getDay() ||
      now.getTime() - lastReset.getTime() > 7 * 24 * 60 * 60 * 1000;

    if (isNewDay) {
      setStats((prev) => ({
        ...prev,
        dailyPomodoros: 0,
        dailyFocusTime: 0,
        lastResetDate: now.toISOString(),
        weeklyPomodoros: isNewWeek ? 0 : prev.weeklyPomodoros,
        weeklyFocusTime: isNewWeek ? 0 : prev.weeklyFocusTime,
      }));
    }
  }, []);

  const handleTimerComplete = () => {
    const audio = new Audio("/notification.mp3");
    audio.play();

    if (timerType === "work") {
      handleWorkSessionComplete();
      setTimerType("break");
      setCurrentTime(breakTime);

      toast({
        title: "Work session complete!",
        description: "Time for a break.",
        duration: 4000,
      });
    } else {
      setTimerType("work");
      setCurrentTime(workTime);

      toast({
        title: "Break time over",
        description: "Ready for another focus session?",
        duration: 4000,
      });
    }

    setTimerStatus("idle");
  };

  // const handleWorkSessionComplete = () => {
  //   setCompletedPomodoros((prev) => prev + 1);
  //   setTotalFocusTime((prev) => prev + workTime);

  //   // Update stats
  //   setStats((prev) => ({
  //     ...prev,
  //     dailyPomodoros: prev.dailyPomodoros + 1,
  //     weeklyPomodoros: prev.weeklyPomodoros + 1,
  //     dailyFocusTime: prev.dailyFocusTime + workTime,
  //     weeklyFocusTime: prev.weeklyFocusTime + workTime,
  //   }));

  //   // Update task progress if a task is active
  //   if (activeTaskId) {
  //     setTasks((prevTasks) =>
  //       prevTasks.map((task) =>
  //         task.id === activeTaskId
  //           ? { ...task, completedPomodoros: task.completedPomodoros + 1 }
  //           : task
  //       )
  //     );
  //   }
  // };

  const startTimer = () => {
    setTimerStatus("running");
  };

  const pauseTimer = () => {
    setTimerStatus("paused");
  };

  const resetTimer = () => {
    setTimerStatus("idle");
    setCurrentTime(timerType === "work" ? workTime : breakTime);
  };

  const updateTimerSettings = (newWorkTime: number, newBreakTime: number) => {
    setWorkTime(newWorkTime);
    setBreakTime(newBreakTime);

    // Reset current time if timer is idle
    if (timerStatus === "idle") {
      setCurrentTime(timerType === "work" ? newWorkTime : newBreakTime);
    }

    setShowTimeSettings(false);
  };

  const addTask = (task: Omit<Task, "id" | "completedPomodoros">) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      completedPomodoros: 0,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
  };

  const setActiveTask = (taskId: string) => {
    setActiveTaskId(taskId);
  };

  const toggleFocusMode = () => {
    setFocusMode((prev) => !prev);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="focusflow-theme">
      <div
        className={`min-h-screen flex flex-col transition-all ${
          focusMode ? "bg-black" : "bg-background"
        }`}
      >
        <Header
          showTimeSettings={showTimeSettings}
          setShowTimeSettings={setShowTimeSettings}
          workTime={workTime}
          breakTime={breakTime}
          updateTimerSettings={updateTimerSettings}
          focusMode={focusMode}
        />

        <main className="container mx-auto px-4 py-6 flex-1 flex flex-col md:flex-row gap-6">
          <div
            className={`w-full md:w-1/2 flex flex-col gap-6 ${
              focusMode ? "md:w-full" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <h2
                className={`text-xl font-bold ${focusMode ? "text-white" : ""}`}
              >
                {timerType === "work" ? "Focus Session" : "Break Time"}
              </h2>
              <FocusModeToggle enabled={focusMode} onToggle={toggleFocusMode} />
            </div>

            <Timer
              currentTime={currentTime}
              timerStatus={timerStatus}
              timerType={timerType}
              focusMode={focusMode}
              workTime={workTime} // Add this
              breakTime={breakTime} // Add this
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
            />

            {activeTaskId && (
              <div
                className={`p-4 rounded-lg border ${
                  focusMode
                    ? "border-gray-700 bg-gray-900"
                    : "border-border bg-card"
                }`}
              >
                <h3 className="text-lg font-medium mb-2">Current Task</h3>
                <div>
                  {tasks.find((task) => task.id === activeTaskId)?.name}
                </div>
              </div>
            )}

            {!focusMode && (
              <StatsSection
                stats={stats}
                completedPomodoros={completedPomodoros}
                totalFocusTime={totalFocusTime}
              />
            )}
          </div>

          {!focusMode && (
            <div className="w-full md:w-1/2">
              <TaskList
                tasks={tasks}
                activeTaskId={activeTaskId}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onSetActiveTask={setActiveTask}
              />
            </div>
          )}
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

// src/utils/timeUtils.ts
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

export const formatTimeToMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
};
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
// src/components/FocusModeToggle.tsx
import React from "react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Focus } from "lucide-react";

interface FocusModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="focus-mode" checked={enabled} onCheckedChange={onToggle} />
      <Label
        htmlFor="focus-mode"
        className={`flex items-center cursor-pointer ${
          enabled ? "text-white" : ""
        }`}
      >
        <Focus className="mr-1 h-4 w-4" /> Focus Mode
      </Label>
    </div>
  );
};

export default FocusModeToggle;
// src/components/Header.tsx
import React, { useState } from "react";
import { Clock, Settings, Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useTheme } from "./theme-provider";

interface HeaderProps {
  showTimeSettings: boolean;
  setShowTimeSettings: (show: boolean) => void;
  workTime: number;
  breakTime: number;
  updateTimerSettings: (workTime: number, breakTime: number) => void;
  focusMode: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showTimeSettings,
  setShowTimeSettings,
  workTime,
  breakTime,
  updateTimerSettings,
  focusMode,
}) => {
  const { theme, setTheme } = useTheme();
  const [workMinutes, setWorkMinutes] = useState(Math.floor(workTime / 60));
  const [breakMinutes, setBreakMinutes] = useState(Math.floor(breakTime / 60));

  const handleSaveSettings = () => {
    updateTimerSettings(workMinutes * 60, breakMinutes * 60);
  };

  return (
    <header
      className={`py-4 px-6 border-b ${
        focusMode ? "bg-black border-gray-800" : "bg-background border-border"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className={`h-6 w-6 ${focusMode ? "text-white" : ""}`} />
          <h1 className={`text-xl font-bold ${focusMode ? "text-white" : ""}`}>
            FocusFlow
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={
              focusMode ? "text-white hover:text-white hover:bg-gray-800" : ""
            }
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          {!focusMode && (
            <Dialog open={showTimeSettings} onOpenChange={setShowTimeSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="workTime" className="text-right">
                      Work Time (minutes)
                    </Label>
                    <Input
                      id="workTime"
                      type="number"
                      min="1"
                      max="60"
                      value={workMinutes}
                      onChange={(e) => setWorkMinutes(Number(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="breakTime" className="text-right">
                      Break Time (minutes)
                    </Label>
                    <Input
                      id="breakTime"
                      type="number"
                      min="1"
                      max="30"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
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

const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  //   completedPomodoros,
  //   totalFocusTime,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Today's Focus Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dailyPomodoros}</div>
          <p className="text-sm text-muted-foreground">
            {formatTimeToMinutes(stats.dailyFocusTime)} total focus time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.weeklyPomodoros}</div>
          <p className="text-sm text-muted-foreground">
            {formatTimeToMinutes(stats.weeklyFocusTime)} total focus time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;
// src/components/TaskList.tsx
import React, { useState } from "react";
import {
  PlusCircle,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Task } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "../lib/utils";

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onAddTask: (task: Omit<Task, "id" | "completedPomodoros">) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSetActiveTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSetActiveTask,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState("");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );

  const resetForm = () => {
    setTaskName("");
    setEstimatedPomodoros(1);
    setTaskNotes("");
    setTaskPriority("medium");
    setEditingTask(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (task: Task) => {
    setEditingTask(task);
    setTaskName(task.name);
    setEstimatedPomodoros(task.estimatedPomodoros);
    setTaskNotes(task.notes || "");
    setTaskPriority(task.priority);
    setShowAddDialog(true);
  };

  const handleSaveTask = () => {
    if (!taskName.trim()) return;

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        name: taskName,
        estimatedPomodoros,
        notes: taskNotes,
        priority: taskPriority,
      });
    } else {
      onAddTask({
        name: taskName,
        estimatedPomodoros,
        notes: taskNotes,
        priority: taskPriority,
      });
    }

    setShowAddDialog(false);
    resetForm();
  };

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "low":
        return "bg-blue-500";
      case "medium":
        return "bg-amber-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tasks</h2>
        <Button onClick={handleOpenAddDialog} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center p-8 bg-card rounded-lg border border-dashed flex flex-col items-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="font-medium">No tasks yet</h3>
            <p className="text-sm text-muted-foreground">
              Start by adding a task to track.
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                "transition-all",
                activeTaskId === task.id
                  ? "border-primary ring-1 ring-primary"
                  : ""
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getPriorityColor(
                        task.priority
                      )}`}
                    />
                    <CardTitle className="text-base font-medium">
                      {task.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEditDialog(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {task.notes && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {task.notes}
                  </p>
                )}
                <div className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress</span>
                    <span>
                      {task.completedPomodoros} / {task.estimatedPomodoros}{" "}
                      pomodoros
                    </span>
                  </div>
                  <Progress
                    value={
                      (task.completedPomodoros / task.estimatedPomodoros) * 100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant={activeTaskId === task.id ? "secondary" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => onSetActiveTask(task.id)}
                >
                  {activeTaskId === task.id ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" /> Current Task
                    </>
                  ) : (
                    <>Start Working</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="grid w-full items-center gap-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name"
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="task-pomodoros">Estimated Pomodoros</Label>
              <Input
                id="task-pomodoros"
                type="number"
                min="1"
                max="20"
                value={estimatedPomodoros}
                onChange={(e) => setEstimatedPomodoros(Number(e.target.value))}
              />
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={taskPriority}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setTaskPriority(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="task-notes">Notes (Optional)</Label>
              <Textarea
                id="task-notes"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Add any additional details"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask}>
              {editingTask ? "Update Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;
// src/components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
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

// src/types.ts
export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  notes?: string;
  priority: "low" | "medium" | "high";
}

export type TimerStatus = "idle" | "running" | "paused";
export type TimerType = "work" | "break";

export interface Stats {
  dailyPomodoros: number;
  weeklyPomodoros: number;
  dailyFocusTime: number;
  weeklyFocusTime: number;
  lastResetDate: string;
}
