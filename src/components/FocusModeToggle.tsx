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
