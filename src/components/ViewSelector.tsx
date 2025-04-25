
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ViewSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#E8EDF5]">
      <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Select View</h1>
        <div className="grid gap-4">
          <Button 
            onClick={() => navigate("/teacher")}
            className="w-full h-16 text-lg"
            variant="outline"
          >
            Teacher's View
          </Button>
          <Button 
            onClick={() => navigate("/student")}
            className="w-full h-16 text-lg"
            variant="outline"
          >
            Students' View
          </Button>
        </div>
      </div>
    </div>
  );
};
