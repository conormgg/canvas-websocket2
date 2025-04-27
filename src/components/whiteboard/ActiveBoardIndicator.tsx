
interface ActiveBoardIndicatorProps {
  isActive: boolean;
}

export const ActiveBoardIndicator = ({ isActive }: ActiveBoardIndicatorProps) => {
  if (!isActive) return null;
  
  return (
    <div className="absolute top-0 left-0 p-2 bg-orange-100 text-orange-700 rounded-bl-lg font-medium text-xs">
      Active Board
    </div>
  );
};
