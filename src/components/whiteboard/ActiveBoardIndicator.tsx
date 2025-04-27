
import { Link } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveBoardIndicatorProps {
  isActive: boolean;
  isLinked?: boolean;
}

export const ActiveBoardIndicator = ({ isActive, isLinked }: ActiveBoardIndicatorProps) => {
  return (
    <>
      {isActive && (
        <div className="absolute top-0 left-0 p-2 bg-orange-100 text-orange-700 rounded-bl-lg font-medium text-xs">
          Active Board
        </div>
      )}
      
      {isLinked && (
        <div className={cn(
          "absolute top-0 right-0 p-2 bg-green-100 text-green-700 rounded-bl-lg font-medium text-xs flex items-center gap-1",
          isActive && "top-0 right-0 rounded-bl-lg rounded-tr-none"
        )}>
          <Link className="h-3 w-3" />
          <span>Linked</span>
        </div>
      )}
    </>
  );
};
