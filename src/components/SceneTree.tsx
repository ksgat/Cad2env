import type { RigScene, Selection } from "../model/types";

interface SceneTreeProps {
  scene: RigScene;
  selection: Selection;
  onSelect: (selection: Selection) => void;
}

export function SceneTree({ scene, selection, onSelect }: SceneTreeProps) {
  return (
    <div className="scene-tree">
      <TreeSection
        label="CAD Parts"
        count={scene.cadParts.length}
        emptyLabel="No CAD parts"
      />

      <div className="tree-section-group">
        <SectionHeader label="Bodies" count={scene.bodies.length} />
        <div className="tree-children">
          {scene.bodies.filter((body) => !body.parentBodyId).length === 0 ? (
            <span className="tree-empty">No bodies</span>
          ) : (
            scene.bodies
              .filter((body) => !body.parentBodyId)
              .map((body) => (
                <BodyTreeNode
                  key={body.id}
                  scene={scene}
                  bodyId={body.id}
                  selection={selection}
                  onSelect={onSelect}
                  depth={0}
                  visited={new Set()}
                />
              ))
          )}
        </div>
      </div>

      <TreeSection
        label="Joints"
        count={scene.joints.length}
        emptyLabel="No joints"
      />
      <TreeSection
        label="Actuators"
        count={scene.actuators.length}
        emptyLabel="No actuators"
      />
    </div>
  );
}

function BodyTreeNode({
  scene,
  bodyId,
  selection,
  onSelect,
  depth,
  visited
}: {
  scene: RigScene;
  bodyId: string;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  depth: number;
  visited: Set<string>;
}) {
  const body = scene.bodies.find((candidate) => candidate.id === bodyId);

  if (!body || visited.has(body.id)) {
    return null;
  }

  const nextVisited = new Set(visited);
  nextVisited.add(body.id);
  const childBodies = scene.bodies.filter(
    (candidate) => candidate.parentBodyId === body.id
  );

  return (
    <div className="tree-node-group">
      <button
        className={treeItemClass(selection.type === "body" && selection.id === body.id)}
        style={{ paddingLeft: `${10 + depth * 14}px` }}
        type="button"
        onClick={() => onSelect({ type: "body", id: body.id })}
      >
        <span className="tree-item-type">body</span>
        <span>{body.name}</span>
      </button>

      {body.geoms.map((geom) => (
        <button
          key={geom.id}
          className={treeItemClass(
            selection.type === "geom" && selection.id === geom.id
          )}
          style={{ paddingLeft: `${24 + depth * 14}px` }}
          type="button"
          onClick={() => onSelect({ type: "geom", id: geom.id })}
        >
          <span className="tree-item-type">{geom.type}</span>
          <span>{geom.name}</span>
        </button>
      ))}

      {childBodies.map((childBody) => (
        <BodyTreeNode
          key={childBody.id}
          scene={scene}
          bodyId={childBody.id}
          selection={selection}
          onSelect={onSelect}
          depth={depth + 1}
          visited={nextVisited}
        />
      ))}
    </div>
  );
}

function TreeSection({
  label,
  count,
  emptyLabel
}: {
  label: string;
  count: number;
  emptyLabel: string;
}) {
  return (
    <div className="tree-section-group">
      <SectionHeader label={label} count={count} />
      <span className="tree-empty">{emptyLabel}</span>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="tree-section-header">
      <span>{label}</span>
      <strong>{count}</strong>
    </div>
  );
}

function treeItemClass(active: boolean): string {
  return active ? "tree-item is-active" : "tree-item";
}
