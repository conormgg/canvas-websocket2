
import { Button } from "@/components/ui/button";

interface CompactColorSelectorProps {
  onColorChange: (color: string) => void;
}

export const CompactColorSelector = ({ onColorChange }: CompactColorSelectorProps) => {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onColorChange("red")}
        className="bg-red-600 w-6 h-6 rounded-full"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onColorChange("blue")}
        className="bg-blue-600 w-6 h-6 rounded-full"
      />
    </>
  );
};
