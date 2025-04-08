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
  workTime: number; // Add this
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onSetActiveTask: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onAddTask,
  workTime, // Add this
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
        focusedMinutes: editingTask.focusedMinutes || 0,
      });
    } else {
      onAddTask({
        name: taskName,
        estimatedPomodoros,
        notes: taskNotes,
        priority: taskPriority,
        focusedMinutes: 0, // Initialize to 0
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
                    <div className="flex items-center gap-2">
                      <span>Progress</span>{" "}
                      <div className="text-xs text-muted-foreground text-right">
                        ({task.focusedMinutes || 0} /{" "}
                        {Math.round(task.estimatedPomodoros * (workTime / 60))}{" "}
                        min)
                      </div>
                    </div>

                    <span>
                      {task.completedPomodoros} / {task.estimatedPomodoros}{" "}
                      sessions
                    </span>
                  </div>
                  <Progress
                    value={
                      ((task.focusedMinutes || 0) /
                        (task.estimatedPomodoros * (workTime / 60))) *
                      100
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
