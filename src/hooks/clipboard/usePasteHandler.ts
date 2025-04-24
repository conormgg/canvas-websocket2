
import { Canvas, util, Point, FabricObject } from "fabric";
import { RefObject } from "react";
import { toast } from "sonner";

export const usePasteHandler = (fabricRef: RefObject<Canvas | null>) => {
  const pasteAtPosition = (clipboardData: any[] | null, pos: Point | null) => {
    if (!fabricRef.current || !clipboardData?.length || !pos) return;

    const canvas = fabricRef.current;
    const toEnliven = [...clipboardData];

    util
      .enlivenObjects(toEnliven)
      .then((objects: FabricObject[]) => {
        if (!objects.length) return;

        let minL = Infinity,
            minT = Infinity;
        objects.forEach((o: any) => {
          if (typeof o.left === "number" && o.left < minL) minL = o.left;
          if (typeof o.top === "number" && o.top < minT) minT = o.top;
        });
        if (!isFinite(minL)) minL = 0;
        if (!isFinite(minT)) minT = 0;

        objects.forEach((o: any) => {
          const dx = typeof o.left === "number" ? o.left - minL : 0;
          const dy = typeof o.top === "number" ? o.top - minT : 0;
          o.set({
            left: pos.x + dx,
            top: pos.y + dy,
            evented: true,
          });
          canvas.add(o);
          if (typeof o.setCoords === "function") o.setCoords();
        });
        canvas.renderAll();
        toast.success("Pasted!");
      })
      .catch((err) => {
        console.error("Paste failed", err);
        toast.error("Could not paste object.");
      });
  };

  return { pasteAtPosition };
};
