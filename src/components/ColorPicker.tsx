import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "#000000e6", label: "Black" },
  { value: "#ea384c", label: "Red" },
  { value: "#1EAEDB", label: "Blue" },
  { value: "#333333", label: "Dark Gray" },
];

interface ColorPickerProps {
  activeColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker = ({ activeColor, onColorChange }: ColorPickerProps) => {
  return (
    <div className="flex items-center gap-1">
      {COLORS.map((color) => (
        <Button
          key={color.value}
          variant="ghost"
          size="icon"
          className={cn(
            "w-8 h-8 rounded-full p-1",
            activeColor === color.value && "ring-2 ring-white"
          )}
          onClick={() => onColorChange(color.value)}
          title={color.label}
        >
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: color.value }}
          />
        </Button>
      ))}
    </div>
  );
};
