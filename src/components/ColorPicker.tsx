
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_COLORS } from "@/config/colorConfig";
import { ColorPickerProps } from "@/types/color";

export const ColorPicker = ({ 
  activeColor, 
  onColorChange,
  size = 'default',
  variant = 'full'
}: ColorPickerProps) => {
  const buttonSize = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  
  return (
    <div className="flex items-center gap-1">
      {DEFAULT_COLORS.map((color) => (
        <Button
          key={color.value}
          variant="ghost"
          size="icon"
          className={cn(
            buttonSize,
            "rounded-full p-1",
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
