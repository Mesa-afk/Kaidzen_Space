"use client";

import { useCallback, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, Handle, MarkerType, Position, getBezierPath, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import dagre from "dagre";
import { useKaizenStore } from "@/lib/store";
import { completedLeafXp, completesDayAt100Xp, splitTask, type TaskNode } from "@/lib/graph";
import { EnergyOrb } from "@/components/energy-orb";
import { XPParticles } from "@/components/xp-particles";
import { playRewardSound } from "@/lib/reward-sound";
import { mockSplitTask } from "@/lib/mock-split";

const NODE_WIDTH = 560;
const NODE_HEIGHT = 140;

type TaskData = {
  task: TaskNode;
  onComplete: (id: string, xp: number, x: number, y: number) => void;
  onSkip: (id: string) => void;
  onSplit: (id: string) => void;
  willReachReward: (id: string) => boolean;
  splitting: boolean;
  completing: boolean;
  soundEnabled: boolean;
};

function TaskCard({ data }: NodeProps<Node<TaskData>>) {
  const { task, onComplete, onSkip, onSplit, willReachReward, splitting, completing, soundEnabled } = data;
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
      className={`task-node ${task.status === "completed" ? "is-completed" : ""} ${task.status === "skipped" ? "is-skipped" : ""} ${completing ? "is-completing" : ""}`}
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
                  disabled={task.status !== "pending" || splitting}
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
                  disabled={task.status !== "pending"}
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
            disabled={task.status !== "pending" || completing}
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
  return <path id={id} d={path} className={`react-flow__edge-path growth-edge ${data?.active ? "edge-active" : ""}`} markerEnd={markerEnd} />;
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
  const currentIndex = current ? graph.findIndex((task) => task.id === current.id) : -1;
  const previous = current 
    ? [...graph.slice(0, currentIndex)].reverse().find((task) => task.type === "task" && task.status !== "pending") 
    : [...graph].reverse().find((task) => task.type === "task");
  const visible = current ? [...(previous ? [previous] : []), current] : previous ? [previous] : [];
  const visibleIds = new Set(visible.map((task) => task.id));
  
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 84, marginx: 24, marginy: 30 });
  
  visible.forEach((task) => dagreGraph.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  visible.forEach((task) => 
    task.dependencies.forEach((dependency) => {
      if (visibleIds.has(dependency)) dagreGraph.setEdge(dependency, task.id);
    })
  );
  
  if (current && previous && !current.dependencies.some((dependency) => dependency === previous.id)) {
    dagreGraph.setEdge(previous.id, current.id);
  }
  
  dagre.layout(dagreGraph);
  
  const nodes: Node<TaskData>[] = visible.map((task) => {
    const point = dagreGraph.node(task.id);
    return {
      id: task.id,
      type: "taskCard",
      position: { x: point.x - NODE_WIDTH / 2, y: point.y - NODE_HEIGHT / 2 },
      data: {
        task,
        onComplete,
        onSkip,
        onSplit,
        willReachReward,
        splitting: splittingId === task.id,
        completing: completingId === task.id,
        soundEnabled,
      },
      draggable: false,
      selectable: false,
    };
  });
  
  const edges: Edge<{ active: boolean }>[] = current && previous ? [
    {
      id: `${previous.id}-${current.id}`,
      source: previous.id,
      target: current.id,
      type: "growth",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#7a9068" },
      data: { active: previous.status !== "pending" },
    },
  ] : [];
  
  return { nodes, edges };
}

export function DayFocus({ roadmapTitle, dayNumber, storageKey, onBack }: { roadmapTitle: string; dayNumber: number; storageKey: string; onBack: () => void }) {
  const graph = useKaizenStore((state) => state.focusGraphs[storageKey] ?? []);
  const soundEnabled = useKaizenStore((state) => state.soundEnabled);
  const updateFocusGraph = useKaizenStore((state) => state.updateFocusGraph);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState<{ xp: number; x: number; y: number } | null>(null);
  
  const onComplete = useCallback((id: string, xp: number, sourceX: number, sourceY: number) => {
    setCompletingId(id);
    
    // Delay actual completion for animation
    setTimeout(() => {
      updateFocusGraph(storageKey, graph.map((task) => 
        task.id === id ? { ...task, status: "completed" } : task
      ));
      setCompletingId(null);
      
      // Show XP particles
      setShowParticles({ xp, x: sourceX, y: sourceY });
      setTimeout(() => setShowParticles(null), 1300);
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
      // Use mock split instead of API for demo
      // In production, this would call: fetch("/api/tasks/split", ...)
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      const mockTasks = mockSplitTask(parent);
      const candidate = splitTask(graph, id, mockTasks);
      updateFocusGraph(storageKey, candidate);
    } catch (error) {
      setSplitError(error instanceof Error ? error.message : "Не удалось раздробить задачу. Попробуй ещё раз.");
    } finally {
      setSplittingId(null);
    }
  }, [graph, storageKey, updateFocusGraph]);
  
  const { nodes, edges } = useMemo(() => 
    arrangeGraph(graph, onComplete, onSkip, onSplit, willReachReward, splittingId, completingId, soundEnabled), 
    [graph, onComplete, onSkip, onSplit, willReachReward, splittingId, completingId, soundEnabled]
  );
  
  const xp = completedLeafXp(graph);
  const pending = graph.filter((task) => task.type === "task" && task.status === "pending").length;
  
  return (
    <section className="focus-page dark-mode">
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
          <strong>
            {xp}<small> XP</small>
          </strong>
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
      
      <div className="flow-stage">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
          minZoom={0.35}
          maxZoom={1.2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2d2f28" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
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
