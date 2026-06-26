import { useEffect, useMemo, useRef, useState } from "react";
import { Display, Viewer, logger } from "three-cad-viewer";
import "three-cad-viewer/css";
import { rigSceneToCadShapes } from "../cad-viewer/rigSceneToCadShapes";
import type { NotificationCallback, RenderOptions, ViewerOptions } from "three-cad-viewer";
import type { RigScene, Selection } from "../model/types";

interface CadViewerViewportProps {
  scene: RigScene;
  onSelect: (selection: Selection) => void;
}

interface ViewportSize {
  width: number;
  height: number;
}

interface CadDisplayOptions {
  cadWidth: number;
  height: number;
  treeWidth: number;
  treeHeight: number;
  theme: "dark";
  pinning: boolean;
  tools: boolean;
  measureTools: boolean;
  measurementDebug: boolean;
  selectTool: boolean;
  explodeTool: boolean;
  zscaleTool: boolean;
  zebraTool: boolean;
  studioTool: boolean;
  glass: boolean;
  newTreeBehavior: boolean;
  keymap: {
    axes: string;
    grid: string;
    reset: string;
    select: string;
  };
}

const renderOptions: RenderOptions = {
  ambientIntensity: 1,
  directIntensity: 1.15,
  metalness: 0.18,
  roughness: 0.68,
  edgeColor: 0x65717d,
  defaultOpacity: 0.62,
  normalLen: 0
};

const viewerOptions: ViewerOptions = {
  control: "orbit",
  up: "Z",
  axes: true,
  axes0: true,
  grid: [true, false, false],
  ortho: true,
  collapse: 2,
  transparent: false,
  blackEdges: false,
  target: [0, 0, 0]
};

export function CadViewerViewport({ scene, onSelect }: CadViewerViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ViewportSize>({ width: 900, height: 560 });
  const shapes = useMemo(() => rigSceneToCadShapes(scene), [scene]);
  const hasRenderableBodies = scene.bodies.length > 0;

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !hasRenderableBodies) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      setSize({
        width: Math.max(360, Math.floor(rect.width)),
        height: Math.max(300, Math.floor(rect.height))
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [hasRenderableBodies]);

  useEffect(() => {
    logger.setLevel("warn");
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.replaceChildren();

    if (!hasRenderableBodies) {
      return;
    }

    const displayOptions: CadDisplayOptions = {
      cadWidth: Math.max(360, size.width - 260),
      height: size.height,
      treeWidth: 260,
      treeHeight: size.height,
      theme: "dark",
      pinning: false,
      tools: true,
      measureTools: true,
      measurementDebug: false,
      selectTool: true,
      explodeTool: true,
      zscaleTool: false,
      zebraTool: true,
      studioTool: false,
      glass: false,
      newTreeBehavior: true,
      keymap: {
        axes: "a",
        grid: "g",
        reset: "r",
        select: "s"
      }
    };
    const notify: NotificationCallback = (change) => {
      if (!change.lastPick) {
        return;
      }

      onSelect(selectionFromViewerPath(change.lastPick.new?.path ?? null));
    };
    const display = new Display(
      container,
      displayOptions as ConstructorParameters<typeof Display>[1]
    );
    const viewer = new Viewer(
      display,
      viewerOptions as ConstructorParameters<typeof Viewer>[1],
      notify
    );

    viewer.render(shapes, renderOptions, viewerOptions);

    return () => {
      viewer.dispose();
      display.dispose();
      container.replaceChildren();
    };
  }, [hasRenderableBodies, onSelect, shapes, size.height, size.width]);

  return (
    <div className="cad-viewer-host">
      <div className="cad-viewer-mount" ref={containerRef} />
      {!hasRenderableBodies ? (
        <div className="cad-viewer-empty">
          <span>CAD2Env Rig Workspace</span>
          <strong>No bodies in scene</strong>
        </div>
      ) : null}
    </div>
  );
}

function selectionFromViewerPath(path: string | null): Selection {
  if (!path) {
    return { type: null, id: null };
  }

  const [, root, bodyId, geomId] = path.split("/");

  if (root !== "CAD2EnvRig" || !bodyId) {
    return { type: null, id: null };
  }

  if (geomId) {
    return { type: "geom", id: geomId };
  }

  return { type: "body", id: bodyId };
}
