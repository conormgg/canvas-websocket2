import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";
import { Split } from "lucide-react";

export const ViewSelector = () => {
  return (
    <div className="min-h-screen bg-[#E8EDF5] flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
        <Link to="/teacher" className="block">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Teacher View</CardTitle>
              <CardDescription>Control the main whiteboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Create and manage content on the primary whiteboard.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/student" className="block">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Student View</CardTitle>
              <CardDescription>View the main whiteboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Observe the content being created on the main whiteboard.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/split-mode" className="block">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="h-6 w-6" />
                Split Mode
              </CardTitle>
              <CardDescription>
                View both teacher and student boards side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Monitor sync between teacher and student boards in real-time
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
