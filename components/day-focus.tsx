"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Background, Controls, Handle, MarkerType, Position, getBezierPath, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { useKaizenStore } from "@/lib/store";
import { completedLeafXp, completesDayAt100Xp, splitTask, type TaskNode } from "@/lib/graph";
import { EnergyOrb } from "@/components/energy-orb";
import { XPParticles } from "@/components/xp-particles";
import { playRewardSound } from "@/lib/reward-sound";
import { mockSplitTask } from "@/lib/mock-split";
import { isBackendEnabled, splitTaskApi } from "@/lib/api-client";

const NODE_STEP_X = 100;
const NODE_STEP_Y = 225;

type TaskData = {
  task: TaskNode;
  onComplete: (id: string, xp: number, x: number, y: number) => void;
  onSkip: (id: string) => void;
  onSplit: (id: string) => void;
  willReachReward: (id: string) => boolean;
  splitting: boolean;
  completing: boolean;
  current: boolean;
  soundEnabled: boolean;
};

function TaskCard({ data }: NodeProps<Node<TaskData>>) {
  const { task, onComplete, onSkip, onSplit, willReachReward, splitting, completing, current, soundEnabled } = data;
  const [menuOpen, setMenuOpen] = useState(false);
  
  const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    // Prevent double-click during animation
    if (completing) return;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const earnsDayReward = willReachReward(task.id);
    onComplete(task.id, task.xp_weight, centerX, centerY);
    
    if (earnsDayReward) {
      playRewardSound(soundEnabled);
    }
  };
  
  return (
    <div 
        className={`task-node ${task.status === "completed" ? "is-completed" : ""} ${task.status === "skipped" ? "is-skipped" : ""} ${completing ? "is-completing" : ""} ${current ? "is-current" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="task-progress-fill" aria-hidden="true" />
      
      <div className="task-card-content">
        <div className="task-copy">
          <div className="task-title">{task.title}</div>
          <div className="task-duration">◷ &nbsp;{task.duration_minutes} минут</div>
        </div>
        
        <div className="task-controls nodrag nopan">
          <div className="task-menu-wrap">
            <button
              className="task-menu-button nodrag nopan"
              aria-label="Настройки задачи"
              aria-expanded={menuOpen}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
            >
              ···
            </button>
            
            {menuOpen && (
              <div className="task-menu nodrag nopan">
                <button
                  className="nodrag nopan"
                  disabled={task.type !== "task" || task.status !== "pending" || splitting}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                    onSplit(task.id);
                  }}
                >
                  {splitting ? (
                    <>
                      <span className="split-spinner" /> Дробим…
                    </>
                  ) : (
                    "Раздробить мельче"
                  )}
                </button>
                
                <button
                  className="nodrag nopan"
                  disabled={task.type !== "task" || task.status !== "pending"}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                    onSkip(task.id);
                  }}
                >
                  Пропустить
                </button>
              </div>
            )}
          </div>
          
          <button
            className={`task-check nodrag nopan ${task.status === "completed" ? "checked" : ""}`}
            aria-label={task.status === "completed" ? "Задача выполнена" : "Отметить выполненной"}
            disabled={task.type !== "task" || task.status !== "pending" || completing}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleComplete}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function GrowingEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: EdgeProps<Edge<{ active: boolean }>>) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return (
    <>
      <path id={id} d={path} pathLength={1} className={`react-flow__edge-path growth-edge ${data?.active ? "edge-active" : ""}`} markerEnd={data?.active ? undefined : markerEnd} />
      {data?.active && <path d={path} pathLength={1} className="growth-edge-tip" markerEnd={markerEnd} aria-hidden="true" />}
    </>
  );
}

const nodeTypes = { taskCard: TaskCard };
const edgeTypes = { growth: GrowingEdge };

function arrangeGraph(
  graph: TaskNode[],
  onComplete: (id: string, xp: number, x: number, y: number) => void,
  onSkip: (id: string) => void,
  onSplit: (id: string) => void,
  willReachReward: (id: string) => boolean,
  splittingId: string | null,
  completingId: string | null,
  justCompletedId: string | null,
  soundEnabled: boolean = true
) {
  const available = graph.filter((task) => 
    task.type === "task" && 
    task.status === "pending" && 
    task.dependencies.every((id) => 
      graph.find((dependency) => dependency.id === id)?.status !== "pending"
    )
  );
  
  const current = available[0];
  const history = graph.filter((task) =>
    (task.type === "task" && task.status !== "pending") || task.type === "container"
  );
  const visible = current && !history.some((task) => task.id === current.id) ? [...history, current] : history;
  const visibleIds = new Set(visible.map((task) => task.id));
  
  const nodes: Node<TaskData>[] = visible.map((task) => {
    return {
      id: task.id,
      type: "taskCard",
      position: { x: 80 + visible.indexOf(task) * NODE_STEP_X, y: 48 + visible.indexOf(task) * NODE_STEP_Y },
      className: task.id === current?.id ? "task-node-current" : undefined,
      data: {
        task,
        onComplete,
        onSkip,
        onSplit,
        willReachReward,
        splitting: splittingId === task.id,
        completing: completingId === task.id,
        current: task.id === current?.id,
        soundEnabled,
      },
      draggable: false,
      selectable: false,
    };
  });
  
  const edges: Edge<{ active: boolean }>[] = visible.flatMap((task) => task.dependencies
    .filter((dependency) => visibleIds.has(dependency))
    .map((dependency) => ({
      id: `${dependency}-${task.id}`,
      source: dependency,
      target: task.id,
      type: "growth",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#7a9068" },
      data: { active: justCompletedId === dependency },
    })));
  
  return { nodes, edges };
}

function FocusCamera({ currentNodeId }: { currentNodeId?: string }) {
  const { fitView } = useReactFlow();
  const previousNodeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!currentNodeId || previousNodeRef.current === currentNodeId) return;
    previousNodeRef.current = currentNodeId;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frame = requestAnimationFrame(() => {
      void fitView({
        nodes: [{ id: currentNodeId }],
        padding: 0.35,
        maxZoom: 0.9,
        duration: reducedMotion ? 0 : 550,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentNodeId, fitView]);

  return null;
}

export function DayFocus({ roadmapTitle, dayNumber, storageKey, onBack }: { roadmapTitle: string; dayNumber: number; storageKey: string; onBack: () => void }) {
  const graph = useKaizenStore((state) => state.focusGraphs[storageKey] ?? []);
  const soundEnabled = useKaizenStore((state) => state.soundEnabled);
  const updateFocusGraph = useKaizenStore((state) => state.updateFocusGraph);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState<{ xp: number; x: number; y: number } | null>(null);
  
  const onComplete = useCallback((id: string, xp: number, sourceX: number, sourceY: number) => {
    setCompletingId(id);
    setJustCompletedId(id);
    
    // Delay actual completion for animation
    setTimeout(() => {
      updateFocusGraph(storageKey, graph.map((task) => 
        task.id === id ? { ...task, status: "completed" } : task
      ));
      setCompletingId(null);
      
      // Show XP particles
      setShowParticles({ xp, x: sourceX, y: sourceY });
      setTimeout(() => setShowParticles(null), 1300);
      setTimeout(() => setJustCompletedId(null), 800);
    }, 600);
  }, [graph, storageKey, updateFocusGraph]);
  
  const onSkip = useCallback((id: string) => 
    updateFocusGraph(storageKey, graph.map((task) => 
      task.id === id ? { ...task, status: "skipped" } : task
    )), 
    [graph, storageKey, updateFocusGraph]
  );
  
  const willReachReward = useCallback((id: string) => {
    return completesDayAt100Xp(graph, id);
  }, [graph]);
  
  const onSplit = useCallback(async (id: string) => {
    const parent = graph.find((task) => task.id === id);
    if (!parent || parent.type !== "task" || parent.status !== "pending") return;
    setSplittingId(id);
    setSplitError(null);
    
    try {
      const serverTasks = isBackendEnabled()
        ? (await splitTaskApi(parent, graph)).tasks
        : await new Promise<ReturnType<typeof mockSplitTask>>((resolve) => setTimeout(() => resolve(mockSplitTask(parent)), 800));
      let serverIdIndex = 0;
      const candidate = splitTask(
        graph,
        id,
        serverTasks,
        isBackendEnabled() ? () => serverTasks[serverIdIndex++].id : undefined,
      );
      updateFocusGraph(storageKey, candidate);
    } catch (error) {
      setSplitError(error instanceof Error ? error.message : "Не удалось раздробить задачу. Попробуй ещё раз.");
    } finally {
      setSplittingId(null);
    }
  }, [graph, storageKey, updateFocusGraph]);
  
  const { nodes, edges } = useMemo(() => 
    arrangeGraph(graph, onComplete, onSkip, onSplit, willReachReward, splittingId, completingId, justCompletedId, soundEnabled), 
    [graph, onComplete, onSkip, onSplit, willReachReward, splittingId, completingId, justCompletedId, soundEnabled]
  );
  
  const xp = completedLeafXp(graph);
  const pending = graph.filter((task) => task.type === "task" && task.status === "pending").length;
  const graphMissing = graph.length === 0;
  
  return (
    <section className="focus-page">
      <button className="back-button" onClick={onBack}>
        ← Назад к дням
      </button>
      
      <header className="focus-header">
        <div>
          <span className="eyebrow">{roadmapTitle.toUpperCase()}</span>
          <h1>
            Фокус дня <em>·</em> {dayNumber}
          </h1>
          <p>Только сегодняшний шаг. Остальное может подождать.</p>
        </div>
        
        <div className="focus-progress">
          <EnergyOrb xp={xp} />
          <span>
            {pending === 0 ? "День завершён" : `Осталось ${pending} шагов`}
          </span>
        </div>
      </header>
      
      <div className="focus-hint">
        <span>✳</span> Закрывай шаг за шагом — следующие задачи откроются сами.
      </div>
      
      {splitError && (
        <div className="split-error" role="alert">
          {splitError}
          <button onClick={() => setSplitError(null)} aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
      
      <div className="flow-stage" data-testid="task-graph" data-node-count={nodes.length}>
        {graphMissing ? (
          <div className="graph-empty" role="alert">
            <strong>Не удалось восстановить задачи этого дня</strong>
            <span>Вернись к карте и открой день ещё раз.</span>
            <button type="button" onClick={onBack}>Вернуться к карте</button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
          minZoom={0.35}
            maxZoom={1.2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
        >
          <FocusCamera currentNodeId={nodes.find((node) => node.data.current)?.id} />
            <Background color="#dfe6d8" gap={22} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
      
      {showParticles && (
        <XPParticles
          xp={showParticles.xp}
          sourceX={showParticles.x}
          sourceY={showParticles.y}
          targetSelector=".avatar"
        />
      )}
    </section>
  );
}
