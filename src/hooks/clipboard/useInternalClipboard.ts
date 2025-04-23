
import { Canvas, util, Point, FabricObject } from "fabric";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export const useInternalClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  /* ------------------------------------------------------------- */
  /*  Local state                                                  */
  /* ------------------------------------------------------------- */
  const clipboardDataRef = useRef<any[] | null>(null);
  const [pastePosition, setPastePosition] = useState<Point | null>(null);
  const awaitingPlacementRef = useRef<boolean>(false);
  const placementPointRef = useRef<{ x: number; y: number } | null>(null);

  /* ------------------------------------------------------------- */
  /*  Sync with GLOBAL clipboard (so every board sees the copy)    */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    const handleGlobalCopy = (e: Event) => {
      const data = (e as CustomEvent).detail?.data;
      if (data) clipboardDataRef.current = data;
    };
    window.addEventListener("whiteboard-global-clipboard", handleGlobalCopy);
    return () =>
      window.removeEventListener(
        "whiteboard-global-clipboard",
        handleGlobalCopy
      );
  }, []);

  /* ------------------------------------------------------------- */
  /*  Click chooses where the next paste will go                   */
  /* ------------------------------------------------------------- */
  const handleCanvasClick = (e: MouseEvent) => {
    const canvas = fabricRef.current;
    if (!canvas || canvas.isDrawingMode) return;

    const p = canvas.getPointer(e);
    placementPointRef.current = { x: p.x, y: p.y };
    setPastePosition(new Point(p.x, p.y));

    if (awaitingPlacementRef.current) {
      awaitingPlacementRef.current = false;
      toast("Paste location set. Press Ctrl+V to paste.");
    }
  };

  /* ------------------------------------------------------------- */
  /*  Copy (Ctrl‑C)  &  Cut (Ctrl‑X) – broadcast globally          */
  /* ------------------------------------------------------------- */
  const handleCopy = (e: KeyboardEvent) => {
    if (!e.ctrlKey || (e.key !== "c" && e.key !== "x") || e.repeat) return;
    e.preventDefault();

    const canvas = fabricRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObjects();
    if (!active.length) return;

    clipboardDataRef.current = active.map((o) => o.toObject(["id"]));

    /* 🌐 GLOBAL: share with every board */
    window.dispatchEvent(
      new CustomEvent("whiteboard-global-clipboard", {
        detail: { data: clipboardDataRef.current },
      })
    );

    const verb = e.key === "x" ? "Cut" : "Copied";
    toast(`${verb} ${active.length > 1 ? active.length + " items" : "1 item"}`);

    awaitingPlacementRef.current = true;
    toast("Click on the destination board to set paste location");

    if (e.key === "x") {
      active.forEach((o) => canvas.remove(o));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  /* ------------------------------------------------------------- */
  /*  Paste objects keeping their relative offsets                 */
  /* ------------------------------------------------------------- */
  const pasteAtPosition = (pos: { x: number; y: number } | null) => {
    if (!fabricRef.current || !clipboardDataRef.current?.length || !pos) return;

    const canvas = fabricRef.current;
    const toEnliven = [...clipboardDataRef.current];

    // Update to use the EnlivenObjectOptions format for Fabric.js v6
    util.enlivenObjects(toEnliven, {
      onComplete: (objects: FabricObject[]) => {
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
          if (typeof o.set !== "function") return;
          const offL = typeof o.left === "number" ? o.left - minL : 0;
          const offT = typeof o.top === "number" ? o.top - minT : 0;
          o.set({ left: pos.x + offL, top: pos.y + offT, evented: true });
          canvas.add(o);
          if (typeof o.setCoords === "function") o.setCoords();
        });

        placementPointRef.current = null; // reset after successful paste
        toast("Object(s) pasted successfully");
        canvas.requestRenderAll();
      }
    });
  };

  /* ------------------------------------------------------------- */
  /*  Helper for Ctrl‑V without pre‑click                          */
  /* ------------------------------------------------------------- */
  const calculatePastePosition = (l = 0, t = 0) => {
    if (pastePosition) {
      const p = { left: pastePosition.x, top: pastePosition.y };
      setPastePosition(null);
      return p;
    }
    return { left: l + 20, top: t + 20 };
  };

  return {
    clipboardDataRef,
    pastePosition,
    setPastePosition,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    awaitingPlacementRef,
    placementPointRef,
    pasteAtPosition,
  };
};
