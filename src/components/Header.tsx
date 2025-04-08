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
