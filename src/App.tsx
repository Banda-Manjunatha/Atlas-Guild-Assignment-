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
    let interval: NodeJS.Timeout | null = null;
    let lastUpdateTime = Date.now(); // Track actual time elapsed

    if (timerStatus === "running") {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval!);
            handleTimerComplete();
            return 0;
          }

          const now = Date.now();
          const elapsedSeconds = Math.floor((now - lastUpdateTime) / 1000);
          lastUpdateTime = now;

          // Only track full minutes
          if (elapsedSeconds >= 60 && timerType === "work" && activeTaskId) {
            const fullMinutes = Math.floor(elapsedSeconds / 60);

            setTasks((prevTasks) =>
              prevTasks.map((task) =>
                task.id === activeTaskId
                  ? {
                      ...task,
                      focusedMinutes: (task.focusedMinutes || 0) + fullMinutes,
                    }
                  : task
              )
            );

            // Update global stats
            setTotalFocusTime((prev) => prev + fullMinutes * 60);
            setStats((prev) => ({
              ...prev,
              dailyFocusTime: prev.dailyFocusTime + fullMinutes * 60,
              weeklyFocusTime: prev.weeklyFocusTime + fullMinutes * 60,
            }));
          }

          return prevTime - elapsedSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus, activeTaskId, timerType]);

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

  const addTask = (
    task: Omit<Task, "id" | "completedPomodoros" | "focusedMinutes">
  ) => {
    const newTask: Task = {
      id: Date.now().toString(),
      ...task,
      completedPomodoros: 0,
      focusedMinutes: 0, // Initialize to 0
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
                workTime={workTime} // Add this
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
