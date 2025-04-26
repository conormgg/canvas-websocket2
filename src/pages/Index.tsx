
import { SplitWhiteboard } from "@/components/SplitWhiteboard";
import { SyncToggle } from "@/components/SyncToggle";

const Index = () => {
  return (
    <div className="relative h-screen w-screen">
      <SplitWhiteboard />
      <SyncToggle />
    </div>
  );
};

export default Index;
