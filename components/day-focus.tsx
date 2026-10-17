"use client";

import { useCallback, useMemo, useState } from "react";
import { ReactFlow, Background, Controls, Handle, MarkerType, Position, getBezierPath, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import dagre from "dagre";
import { useKaizenStore } from "@/lib/store";
import { splitTask, type TaskNode } from "@/lib/graph";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 145;

type TaskData = {
  task: TaskNode;
  locked: boolean;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onSplit: (id: string) => void;
  splitting: boolean;
};

function TaskCard({ data }: NodeProps<Node<TaskData>>) {
  const { task, locked, onComplete, onSkip, onSplit, splitting } = data;
  const container = task.type === "container";
  return <div className={`task-node ${task.status === "completed" ? "is-completed" : ""} ${task.status === "skipped" ? "is-skipped" : ""} ${locked ? "is-locked" : ""} ${container ? "is-container" : ""}`}>
    <Handle type="target" position={Position.Top} />
    <div className="task-node-top"><span className="task-kicker">{container ? "РАЗБИТАЯ ЗАДАЧА" : "МИКРОШАГ"}</span><span className="task-xp">{container ? "—" : `${task.xp_weight} XP`}</span></div>
    <div className="task-title">{task.title}</div>
    <div className="task-duration">◷ &nbsp;{task.duration_minutes} мин</div>
    <div className="task-actions">
      {container ? <span className="task-container-note">Заверши подшаги, чтобы продолжить</span> : <>
        <button className="task-check" disabled={locked || task.status !== "pending"} onClick={() => onComplete(task.id)}>{task.status === "completed" ? "✓ Выполнено" : task.status === "skipped" ? "Пропущено" : "○ Выполнено"}</button>
        {task.status === "pending" && <button className="task-skip" disabled={locked} onClick={() => onSkip(task.id)} title="Пропустить без XP">Пропустить</button>}
        <button className="task-split" disabled={locked || task.status !== "pending" || task.xp_weight < 2 || splitting} onClick={() => onSplit(task.id)} title={task.xp_weight < 2 ? "Недостаточно XP для дробления без нулевых долей" : "Раздробить задачу на микрошаги"}>{splitting ? <span className="split-spinner"/> : "↳"}</button>
      </>}
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>;
}

function GrowingEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: EdgeProps<Edge<{ active: boolean }>>) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <path id={id} d={path} className={`react-flow__edge-path growth-edge ${data?.active ? "edge-active" : ""}`} markerEnd={markerEnd} />;
}

const nodeTypes = { taskCard: TaskCard };
const edgeTypes = { growth: GrowingEdge };

function arrangeGraph(graph: TaskNode[], onComplete: (id: string) => void, onSkip: (id: string) => void, onSplit: (id: string) => void, splittingId: string | null) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 48, ranksep: 74, marginx: 24, marginy: 30 });
  graph.forEach((task) => dagreGraph.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  graph.forEach((task) => task.dependencies.forEach((dependency) => dagreGraph.setEdge(dependency, task.id)));
  dagre.layout(dagreGraph);
  const nodeById = new Map(graph.map((task) => [task.id, task]));
  const nodes: Node<TaskData>[] = graph.map((task) => {
    const point = dagreGraph.node(task.id);
    const locked = task.dependencies.some((id) => nodeById.get(id)?.status === "pending");
    return { id: task.id, type: "taskCard", position: { x: point.x - NODE_WIDTH / 2, y: point.y - NODE_HEIGHT / 2 }, data: { task, locked, onComplete, onSkip, onSplit, splitting: splittingId === task.id }, draggable: false, selectable: false };
  });
  const edges: Edge<{ active: boolean }>[] = graph.flatMap((task) => task.dependencies.map((dependency) => ({
    id: `${dependency}-${task.id}`, source: dependency, target: task.id, type: "growth", markerEnd: { type: MarkerType.ArrowClosed, color: nodeById.get(dependency)?.status === "pending" ? "#c6ccbd" : "#829873" },
    data: { active: nodeById.get(dependency)?.status !== "pending" },
  })));
  return { nodes, edges };
}

export function DayFocus({ roadmapTitle, dayNumber, storageKey, onBack }: { roadmapTitle: string; dayNumber: number; storageKey: string; onBack: () => void }) {
  const graph = useKaizenStore((state) => state.focusGraphs[storageKey] ?? []);
  const updateFocusGraph = useKaizenStore((state) => state.updateFocusGraph);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const onComplete = useCallback((id: string) => updateFocusGraph(storageKey, graph.map((task) => task.id === id ? { ...task, status: "completed" } : task)), [graph, storageKey, updateFocusGraph]);
  const onSkip = useCallback((id: string) => updateFocusGraph(storageKey, graph.map((task) => task.id === id ? { ...task, status: "skipped" } : task)), [graph, storageKey, updateFocusGraph]);
  const onSplit = useCallback(async (id: string) => {
    const parent = graph.find((task) => task.id === id);
    if (!parent || parent.type !== "task" || parent.status !== "pending") return;
    setSplittingId(id);
    setSplitError(null);
    try {
      const response = await fetch("/api/tasks/split", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: parent, graph }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Не удалось раздробить задачу.");
      const candidate = splitTask(graph, id, result.tasks as TaskNode[]);
      updateFocusGraph(storageKey, candidate);
    } catch (error) {
      setSplitError(error instanceof Error ? error.message : "Не удалось раздробить задачу. Попробуй ещё раз.");
    } finally {
      setSplittingId(null);
    }
  }, [graph, storageKey, updateFocusGraph]);
  const { nodes, edges } = useMemo(() => arrangeGraph(graph, onComplete, onSkip, onSplit, splittingId), [graph, onComplete, onSkip, onSplit, splittingId]);
  const xp = graph.filter((task) => task.type === "task" && task.status === "completed").reduce((sum, task) => sum + task.xp_weight, 0);
  const pending = graph.filter((task) => task.type === "task" && task.status === "pending").length;
  return <section className="focus-page">
    <button className="back-button" onClick={onBack}>← Назад к дням</button>
    <header className="focus-header"><div><span className="eyebrow">{roadmapTitle.toUpperCase()}</span><h1>Фокус дня <em>·</em> {dayNumber}</h1><p>Только сегодняшний шаг. Остальное может подождать.</p></div><div className="focus-progress"><strong>{xp}<small> XP</small></strong><span>{pending === 0 ? "День завершён" : `Осталось ${pending} шагов`}</span></div></header>
    <div className="focus-hint"><span>✳</span> Закрывай шаг за шагом — следующие задачи откроются сами.</div>
    {splitError && <div className="split-error" role="alert">{splitError}<button onClick={() => setSplitError(null)} aria-label="Закрыть">×</button></div>}
    <div className="flow-stage"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.22, maxZoom: 1 }} minZoom={0.35} maxZoom={1.2} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}><Background color="#e7e9e2" gap={22} size={1} /><Controls showInteractive={false} /></ReactFlow></div>
  </section>;
}
