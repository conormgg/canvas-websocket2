
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InkThicknessSelectorProps {
  inkThickness: number;
  onInkThicknessChange: (thickness: number) => void;
  isSplitScreen?: boolean;
}

export const InkThicknessSelector = ({
  inkThickness,
  onInkThicknessChange,
  isSplitScreen = false,
}: InkThicknessSelectorProps) => {
  return (
    <Select
      value={inkThickness.toString()}
      onValueChange={(value) => onInkThicknessChange(Number(value))}
    >
      <SelectTrigger 
        className={
          isSplitScreen 
            ? "w-[60px] h-[28px] text-xs text-white border border-gray-600 bg-transparent"
            : "w-24 bg-transparent text-white border-gray-600"
        }
      >
        <SelectValue placeholder="Size" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="2">Thin</SelectItem>
        <SelectItem value="4">Medium</SelectItem>
        <SelectItem value="6">Thick</SelectItem>
      </SelectContent>
    </Select>
  );
};
