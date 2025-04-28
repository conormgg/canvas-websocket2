
import { Button } from "@/components/ui/button";
import { DEFAULT_COLORS } from "@/config/colorConfig";
import { ColorPickerProps } from "@/types/color";

export const CompactColorSelector = ({ onColorChange }: Pick<ColorPickerProps, 'onColorChange'>) => {
  return (
    <>
      {DEFAULT_COLORS.slice(1, 3).map((color) => (
        <Button
          key={color.value}
          variant="ghost"
          size="icon"
          onClick={() => onColorChange(color.value)}
          className={`${color.value === '#ea384c' ? 'bg-red-600' : 'bg-blue-600'} w-6 h-6 rounded-full`}
        />
      ))}
    </>
  );
};
