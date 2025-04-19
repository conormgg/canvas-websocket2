
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "#D3E4FD", label: "Soft Blue" },
  { value: "#E5DEFF", label: "Soft Purple" },
  { value: "#FFDEE2", label: "Soft Pink" },
  { value: "#F2FCE2", label: "Soft Green" },
  { value: "#FEC6A1", label: "Soft Orange" },
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
