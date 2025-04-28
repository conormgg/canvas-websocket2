
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutPanelLeft, Split, LayoutGrid } from "lucide-react";

export const ViewSelector = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#E8EDF5]">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Select a View</h1>
        <div className="flex gap-4">
          <Link to="/teacher">
            <Button variant="outline" size="lg" className="w-40 flex gap-2">
              <LayoutGrid className="h-5 w-5" />
              Teacher View
            </Button>
          </Link>
          <Link to="/student">
            <Button variant="outline" size="lg" className="w-40 flex gap-2">
              <LayoutPanelLeft className="h-5 w-5" />
              Student View
            </Button>
          </Link>
          <Link to="/sync-test">
            <Button variant="outline" size="lg" className="w-40 flex gap-2">
              <Split className="h-5 w-5" />
              Sync Test
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
