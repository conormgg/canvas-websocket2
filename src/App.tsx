
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClipboardProvider } from "@/context/ClipboardContext";
import { SyncProvider } from "@/context/SyncContext";
import { ViewSelector } from "./components/ViewSelector";
import { StudentView } from "./components/StudentView";
import { SplitModeView } from "./components/SplitModeView";
import NotFound from "./pages/NotFound";
import { SplitWhiteboard } from "./components/SplitWhiteboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClipboardProvider>
        <SyncProvider>
          <Sonner position="bottom-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<ViewSelector />} />
              <Route path="/teacher" element={<SplitWhiteboard />} />
              <Route path="/student" element={<StudentView />} />
              <Route path="/split-mode" element={<SplitModeView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SyncProvider>
      </ClipboardProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
