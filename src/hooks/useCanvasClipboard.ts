// src/hooks/useCanvasClipboard.ts
import { Canvas, util, Point, FabricObject } from "fabric";
import { useEffect, useRef } from "react";
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

  // Pass the internal clipboard reference to useExternalClipboard
  const { handleExternalPaste } = useExternalClipboard(
    fabricRef,
    pastePosition,
    clipboardDataRef  // Pass the clipboard reference as the third argument
  );

  const handlePaste = (e: KeyboardEvent) => {
    // only handle Ctrl+V when this canvas wrapper is focused
    const wrapper = fabricRef.current?.wrapperEl;
    if (!wrapper || !wrapper.contains(document.activeElement)) return;
    if (e.repeat) return;
    if (!e.ctrlKey || e.key.toLowerCase() !== "v") return;

    e.preventDefault();

    const canvas = fabricRef.current;
    const internalData = clipboardDataRef.current;

    // if nothing in our internal clipboard, fall back to external paste event
    if (!internalData?.length) {
      // We'll rely on the paste event to trigger handleExternalPaste
      return;
    }

    // if waiting for placement click, defer to that
    if (awaitingPlacementRef.current) {
      return;
    }

    // if user already clicked to set placement, use that
    if (placementPointRef.current) {
      pasteAtPosition(placementPointRef.current);
      return;
    }

    // otherwise do a normal "click-free" paste at last click or offset
    const toEnliven = [...internalData];
    util.enlivenObjects(toEnliven).then((objects: any[]) => {
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

      // select the pasted object(s)
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
    });
  };

  useEffect(() => {
    const canvas = fabricRef.current;
    const wrapper = canvas?.wrapperEl;
    if (!wrapper) return;

    // ensure wrapper can receive keyboard + paste events
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

  // allow Esc to cancel a pending placement
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
