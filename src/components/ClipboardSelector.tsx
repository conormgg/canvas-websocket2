
import { Point } from "fabric";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageOff, ClipboardPaste, ClipboardSignature } from "lucide-react";

interface ClipboardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onInternalPaste: () => void;
  onSystemPaste: () => void;
  hasInternalClipboard: boolean;
}

export const ClipboardSelector = ({
  isOpen,
  onClose,
  onInternalPaste,
  onSystemPaste,
  hasInternalClipboard,
}: ClipboardSelectorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Clipboard Source</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            onClick={onInternalPaste}
            disabled={!hasInternalClipboard}
            className="flex flex-col items-center justify-center gap-2 h-24"
          >
            {hasInternalClipboard ? (
              <ClipboardSignature className="h-8 w-8" />
            ) : (
              <ImageOff className="h-8 w-8" />
            )}
            <span>Canvas Clipboard</span>
          </Button>
          <Button
            onClick={onSystemPaste}
            className="flex flex-col items-center justify-center gap-2 h-24"
          >
            <ClipboardPaste className="h-8 w-8" />
            <span>System Clipboard</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
