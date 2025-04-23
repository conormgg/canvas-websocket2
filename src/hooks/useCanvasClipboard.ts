import { Canvas, util, Point, FabricObject } from "fabric";
import { useEffect } from "react";
import { useInternalClipboard } from "./clipboard/useInternalClipboard";
import { useExternalClipboard } from "./clipboard/useExternalClipboard";

export const useCanvasClipboard = (
  fabricRef: React.MutableRefObject<Canvas | null>
) => {
  const {
    clipboardDataRef,
    pastePosition,
    setPastePosition,
    handleCanvasClick,
    handleCopy,
    calculatePastePosition,
    awaitingPlacementRef,
    placementPointRef,
    pasteAtPosition,
  } = useInternalClipboard(fabricRef);

  const { tryExternalPaste, handleExternalPaste } = useExternalClipboard(
    fabricRef,
    pastePosition,
    clipboardDataRef
  );

  const handlePaste = (e: KeyboardEvent) => {
    const wrapper = fabricRef.current?.wrapperEl;
    if (!wrapper || !wrapper.contains(document.activeElement)) return;
    if (e.repeat) return;
    if (!e.ctrlKey || e.key.toLowerCase() !== "v") return;

    e.preventDefault();

    const canvas = fabricRef.current;
    const internalData = clipboardDataRef.current;

    if (!internalData?.length) {
      tryExternalPaste();
      return;
    }

    if (awaitingPlacementRef.current) {
      return;
    }

    if (placementPointRef.current) {
      pasteAtPosition(placementPointRef.current);
      return;
    }

    const toEnliven = [...internalData];
    
    util.enlivenObjects(toEnliven, {
      callback: (objects: FabricObject[]) => {
        objects.forEach((obj: any) => {
          if (typeof obj !== "object") return;
          const originalLeft = typeof obj.left === "number" ? obj.left : 0;
          const originalTop = typeof obj.top === "number" ? obj.top : 0;
          const { left, top } = calculatePastePosition(originalLeft, originalTop);

          if (typeof obj.set === "function") {
            obj.set({ left, top, evented: true });
            canvas?.add(obj);
            if (typeof obj.setCoords === "function") obj.setCoords();
          }
        });

        if (objects.length === 1) {
          const first = objects[0];
          if (first && typeof first.setCoords === "function") {
            canvas?.setActiveObject(first as FabricObject);
          }
        } else if (objects.length > 1) {
          canvas?.discardActiveObject();
        }

        setPastePosition(null);
        canvas?.requestRenderAll();
      }
    });
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    const wrapper = canvas?.wrapperEl;
    if (!wrapper) return;

    if (wrapper.tabIndex < 0) wrapper.tabIndex = 0;

    wrapper.addEventListener("click", handleCanvasClick);
    wrapper.addEventListener("keydown", handleCopy);
    wrapper.addEventListener("keydown", handlePaste);
    wrapper.addEventListener("paste", handleExternalPaste);

    return () => {
      wrapper.removeEventListener("click", handleCanvasClick);
      wrapper.removeEventListener("keydown", handleCopy);
      wrapper.removeEventListener("keydown", handlePaste);
      wrapper.removeEventListener("paste", handleExternalPaste);
    };
  }, [fabricRef.current]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && awaitingPlacementRef.current) {
        awaitingPlacementRef.current = false;
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return { clipboardDataRef, pastePosition, setPastePosition };
};
