"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, Background, Controls, Handle, MarkerType, Position, getBezierPath, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { useKaizenStore } from "@/lib/store";
import { completedLeafXp, completesDayAt100Xp, distributeXp, splitTask, type TaskNode } from "@/lib/graph";
import type { Roadmap } from "@/lib/roadmaps";
import { EnergyOrb } from "@/components/energy-orb";
import { XPParticles } from "@/components/xp-particles";
import { useKaizenSounds } from "@/lib/use-kaizen-sounds";
import { mockSplitTask } from "@/lib/mock-split";
import { generateDaySessionApi, isBackendEnabled, splitTaskApi } from "@/lib/api-client";
import type { DailySessionResponse, GenerateDaySessionRequest, StoredDailySessionTask } from "@/lib/day-session-contract";
import { adaptLegacyTaskGraphToSession, creditedSecondsForCompletedTasks } from "@/lib/day-session-store";
import { getSchedulerPhase } from "@/lib/kaizenScheduler";
import { ICNU_MODIFIERS } from "@/lib/icnuModifiers";

const NODE_STEP_X = 250;
const NODE_STEP_Y = 270;
const SPLIT_STEP_Y = 260;
const EMPTY_TASK_GRAPH: TaskNode[] = [];

const COGNITIVE_ROLE_LABELS: Record<string, string> = {
  SCAFFOLD_SETUP: "Подготовка",
  MIND_SCULPT_ANCHOR: "Опорный образ",
  MENTAL_HOOK: "Ментальная зацепка",
  FAST_FEEDBACK_DRILL: "Быстрая практика",
  INVERSION_PLAY: "Инверсия",
  SPACED_RETRIEVAL: "Повторение",
  SPEED_SPRINT: "Короткий спринт",
  BIO_RESET: "Перезагрузка",
  CHALLENGE_TWIST: "Новый вызов",
  PROJECT_BUILD: "Сборка проекта",
};

type TaskData = {
  task: TaskNode;
  onComplete: (id: string, xp: number, x: number, y: number) => void;
  onSkip: (id: string) => void;
  onSplit: (id: string) => void;
  splitting: boolean;
  completing: boolean;
  current: boolean;
  sessionLoading: boolean;
  sessionTask?: StoredDailySessionTask;
};

function TaskCard({ data }: NodeProps<Node<TaskData>>) {
  const { task, onComplete, onSkip, onSplit, splitting, completing, current, sessionLoading, sessionTask } = data;
  const [menuOpen, setMenuOpen] = useState(false);
  const completionAcceptedRef = useRef(false);
  const durationSeconds = sessionTask?.durationSeconds ?? task.duration_minutes * 60;
  const durationText = durationSeconds < 60
    ? `${durationSeconds} сек`
    : durationSeconds % 60 === 0
      ? `${durationSeconds / 60} мин`
      : `${Math.floor(durationSeconds / 60)} мин ${durationSeconds % 60} сек`;
  
  const handleComplete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    // Prevent double-click during animation
    if (completing || completionAcceptedRef.current) return;
    completionAcceptedRef.current = true;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    onComplete(task.id, task.xp_weight, centerX, centerY);
  };
  
  return (
    <div 
        className={`task-node ${sessionTask ? "has-session-data" : ""} ${task.status === "completed" ? "is-completed" : ""} ${task.status === "skipped" ? "is-skipped" : ""} ${completing ? "is-completing" : ""} ${current ? "is-current" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="task-progress-fill" aria-hidden="true" />
      
      <div className="task-card-content">
        <div className="task-copy">
          <div className="task-title">{task.title}</div>
          <div className="task-duration">◷ &nbsp;{durationText}</div>
          {sessionTask && (
            <div className="task-session-details">
              <div className="task-session-tags">
                <span className="task-session-role">{COGNITIVE_ROLE_LABELS[sessionTask.cognitiveRole] ?? sessionTask.cognitiveRole}</span>
                <span className="task-session-icnu">{sessionTask.icnuTrigger.label}</span>
              </div>
              <p className="task-session-instruction">{sessionTask.instruction}</p>
              <p className="task-session-evidence"><strong>Проверка:</strong> {sessionTask.evidenceMethod}</p>
            </div>
          )}
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
                  disabled={sessionLoading || !current || task.type !== "task" || task.status !== "pending" || splitting}
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
                  disabled={sessionLoading || !current || task.type !== "task" || task.status !== "pending"}
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
            disabled={sessionLoading || !current || task.type !== "task" || task.status !== "pending" || completing}
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

function calendarDaysMissed(lastCompletedAt?: string): number {
  if (!lastCompletedAt) return 0;
  const completed = new Date(lastCompletedAt);
  if (Number.isNaN(completed.getTime())) return 0;
  const start = Date.UTC(completed.getUTCFullYear(), completed.getUTCMonth(), completed.getUTCDate());
  const today = new Date();
  const current = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.floor((current - start) / 86_400_000) - 1);
}

function taskIsAvailable(graph: TaskNode[], taskId: string): boolean {
  const task = graph.find((node) => node.id === taskId);
  return Boolean(task && task.type === "task" && task.status === "pending" && task.dependencies.every((dependencyId) =>
    graph.find((node) => node.id === dependencyId)?.status !== "pending"
  ));
}

function buildDemoDaySession(
  roadmap: Roadmap,
  roadmapDay: { dayNumber: number; title: string; subskillId?: string; tasks: string[] },
  dayNumber: number,
) {
  const ids = roadmapDay.tasks.map(() => crypto.randomUUID());
  const weights = distributeXp(100, roadmapDay.tasks.length);
  const demoGraph: TaskNode[] = roadmapDay.tasks.map((title, index) => ({
    id: ids[index],
    parent_id: null,
    type: "task",
    status: "pending",
    title,
    duration_minutes: Math.max(1, Math.floor(120 / roadmapDay.tasks.length / 60)),
    xp_weight: weights[index],
    dependencies: index === 0 ? [] : [ids[index - 1]],
  }));
  const legacySession = adaptLegacyTaskGraphToSession({
    roadmapId: roadmap.id,
    roadmapTitle: roadmap.title,
    dayNumber,
    dayTitle: roadmapDay.title,
    subskillId: roadmapDay.subskillId,
    subskillDescription: roadmap.subskills?.find((item) => item.id === roadmapDay.subskillId)?.description,
    graph: demoGraph,
  });
  return { demoGraph, legacySession };
}

const nodeTypes = { taskCard: TaskCard };
const edgeTypes = { growth: GrowingEdge };

function arrangeGraph(
  graph: TaskNode[],
  sessionTasks: ReadonlyMap<string, StoredDailySessionTask>,
  onComplete: (id: string, xp: number, x: number, y: number) => void,
  onSkip: (id: string) => void,
  onSplit: (id: string) => void,
  splittingId: string | null,
  completingId: string | null,
  justCompletedId: string | null,
  sessionLoading: boolean
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
  const topLevelHistory = history.filter((task) => task.parent_id === null);
  const splitParent = current?.parent_id
    ? graph.find((task) => task.id === current.parent_id && task.type === "container")
    : undefined;
  const splitChildren = splitParent
    ? graph.filter((task) => task.type === "task" && task.parent_id === splitParent.id)
    : [];
  const visible = splitParent
    ? [...history, ...splitChildren.filter((task) => !history.some((item) => item.id === task.id))]
    : current && !history.some((task) => task.id === current.id) ? [...history, current] : history;
  const visibleIds = new Set(visible.map((task) => task.id));
  
  const nodes: Node<TaskData>[] = visible.map((task) => {
    const parent = task.parent_id ? graph.find((item) => item.id === task.parent_id) : undefined;
    const parentIndex = parent ? topLevelHistory.findIndex((item) => item.id === parent.id) : -1;
    const routeIndex = topLevelHistory.findIndex((item) => item.id === task.id);
    const childIndex = parent ? splitChildren.findIndex((item) => item.id === task.id) : -1;
    const position = parent && parentIndex >= 0
      ? { x: 80 + parentIndex * NODE_STEP_X + NODE_STEP_X, y: 48 + parentIndex * NODE_STEP_Y + (childIndex + 1) * SPLIT_STEP_Y }
      : { x: 80 + (routeIndex >= 0 ? routeIndex : topLevelHistory.length) * NODE_STEP_X, y: 48 + (routeIndex >= 0 ? routeIndex : topLevelHistory.length) * NODE_STEP_Y };
    return {
      id: task.id,
      type: "taskCard",
      position,
      className: task.id === current?.id ? "task-node-current" : undefined,
      data: {
        task,
        onComplete,
        onSkip,
        onSplit,
        splitting: splittingId === task.id,
        completing: completingId === task.id,
        current: task.id === current?.id,
        sessionLoading,
        sessionTask: sessionTasks.get(task.id),
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
      markerEnd: { type: MarkerType.ArrowClosed, color: "currentColor" },
      data: { active: justCompletedId === dependency },
    })));
  if (splitParent && splitChildren[0] && visibleIds.has(splitChildren[0].id)) {
    edges.push({
      id: `${splitParent.id}-${splitChildren[0].id}-parent`,
      source: splitParent.id,
      target: splitChildren[0].id,
      type: "growth",
      markerEnd: { type: MarkerType.ArrowClosed, color: "currentColor" },
      data: { active: false },
    });
  }
  
  return { nodes, edges };
}

function FocusCamera({ nodeIds }: { nodeIds: string[] }) {
  const { fitView, getNodes } = useReactFlow();
  const previousNodeRef = useRef<string>("");
  const cameraKey = nodeIds.join("|");

  useEffect(() => {
    if (!cameraKey || previousNodeRef.current === cameraKey) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      const selected = getNodes().filter((node) => nodeIds.includes(node.id));
      if (!selected.length) return;
      previousNodeRef.current = cameraKey;
      void fitView({
        nodes: selected,
        padding: selected.length > 1 ? 0.12 : 0.35,
        minZoom: selected.length > 1 ? 0.42 : 0.7,
        maxZoom: selected.length > 1 ? 0.54 : 0.9,
        duration: reducedMotion ? 0 : 550,
      });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [cameraKey, fitView, getNodes, nodeIds]);

  return null;
}

export function DayFocus({ roadmapTitle, roadmap, dayNumber, storageKey, onBack }: { roadmapTitle: string; roadmap: Roadmap; dayNumber: number; storageKey: string; onBack: () => void }) {
  const storedGraph = useKaizenStore((state) => state.focusGraphs[storageKey]);
  const graph = storedGraph ?? EMPTY_TASK_GRAPH;
  const graphHasProgress = graph.some((task) => task.type === "container" || task.status !== "pending");
  const daySession = useKaizenStore((state) => state.daySessions[storageKey]);
  const persistedRequestKey = useKaizenStore((state) => state.daySessionRequestKeys[storageKey]);
  const daySessions = useKaizenStore((state) => state.daySessions);
  const allFocusGraphs = useKaizenStore((state) => state.focusGraphs);
  const soundEnabled = useKaizenStore((state) => state.soundEnabled);
  const updateFocusGraph = useKaizenStore((state) => state.updateFocusGraph);
  const setDaySession = useKaizenStore((state) => state.setDaySession);
  const setDaySessionWithGraph = useKaizenStore((state) => state.setDaySessionWithGraph);
  const saveGeneratedDaySession = useKaizenStore((state) => state.saveGeneratedDaySession);
  const setDaySessionRequestKey = useKaizenStore((state) => state.setDaySessionRequestKey);
  const addDaySessionTaskMetadata = useKaizenStore((state) => state.addDaySessionTaskMetadata);
  const markDaySessionCompleted = useKaizenStore((state) => state.markDaySessionCompleted);
  const { playTaskComplete, playDayComplete } = useKaizenSounds();
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState<{ xp: number; x: number; y: number } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(() =>
    !daySession && !graphHasProgress && (graph.length === 0 || isBackendEnabled())
  );
  const isSessionLoading = sessionLoading && !daySession && !graphHasProgress;
  const sessionReady = Boolean(daySession) && !isSessionLoading;
  const [sessionError, setSessionError] = useState<string | null>(null);
  const requestKeyRef = useRef<string | null>(persistedRequestKey ?? null);
  const requestInFlightRef = useRef(false);
  const roadmapDay = roadmap.days.find((item) => item.dayNumber === dayNumber);
  const metadataByTaskId = useMemo(() => new Map(daySession?.tasks.map((item) => [item.taskId, item]) ?? []), [daySession?.tasks]);

  const generateSession = useCallback(async () => {
    const graphIsExistingSession = graph.length > 0 && (graphHasProgress || !isBackendEnabled());
    if (requestInFlightRef.current || daySession || graphIsExistingSession) return;
    if (!roadmapDay) {
      setSessionError("Не удалось найти этот день в маршруте.");
      setSessionLoading(false);
      return;
    }

    requestInFlightRef.current = true;
    setSessionLoading(true);
    setSessionError(null);
    try {
      if (!isBackendEnabled()) {
        if (roadmapDay.tasks.length === 0) throw new Error("Для этого дня ещё нет задач. Попробуй открыть его позже.");
        const { demoGraph, legacySession } = buildDemoDaySession(roadmap, roadmapDay, dayNumber);
        setDaySessionWithGraph(storageKey, legacySession, demoGraph);
        return;
      }

      const completedSessions = Object.entries(daySessions)
        .filter(([key, session]) => key.startsWith(`${roadmap.id}:`) && session.completedAt)
        .sort(([, left], [, right]) => (left.completedAt ?? "").localeCompare(right.completedAt ?? ""));
      const lastCompleted = completedSessions.at(-1)?.[1];
      const effectiveDay = Math.min(66, (lastCompleted?.effectiveDay ?? 0) + 1);
      const daysMissed = calendarDaysMissed(lastCompleted?.completedAt);
      const sessionHistory = Object.entries(daySessions)
        .filter(([key]) => key.startsWith(`${roadmap.id}:`))
        .map(([key, session]) => {
          const historyGraph = allFocusGraphs[key] ?? [];
          return {
            effectiveDay: session.effectiveDay,
            dayNumber: session.dayNumber,
            completed: Boolean(session.completedAt) && completedLeafXp(historyGraph) >= 100,
            subskillId: session.subskill.id,
            subskillTitle: session.subskill.title,
            subskillDescription: session.subskill.description,
            creditedSeconds: creditedSecondsForCompletedTasks(session, historyGraph),
          };
        });
      const subskill = roadmap.subskills?.find((item) => item.id === roadmapDay.subskillId);
      const currentSubskill = {
        id: subskill?.id ?? roadmapDay.subskillId ?? `legacy-day-${dayNumber}`,
        title: subskill?.title ?? roadmapDay.title,
        description: subskill?.description ?? roadmap.description,
      };
      const request: GenerateDaySessionRequest = {
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
        roadmapDescription: roadmap.description,
        goal: roadmap.title,
        lovableProject: roadmap.lovableProject,
        targetPerformanceLevel: roadmap.targetPerformanceLevel,
        dayNumber,
        dayTitle: roadmapDay.title,
        subskill: currentSubskill,
        effectiveDay,
        phase: daysMissed >= 2 ? "RSD_RECOVERY" : getSchedulerPhase(effectiveDay),
        daysMissed,
        wasTooHard: false,
        sessionHistory,
        usedModifierIds: [...new Set(Object.entries(daySessions)
          .filter(([key]) => key.startsWith(`${roadmap.id}:`))
          .flatMap(([, session]) => session.tasks.map((item) => item.icnuTrigger.id)))],
      };
      const requestKey = requestKeyRef.current ?? persistedRequestKey ?? crypto.randomUUID();
      requestKeyRef.current = requestKey;
      setDaySessionRequestKey(storageKey, requestKey);
      const generated: DailySessionResponse = await generateDaySessionApi(request, requestKey);
      saveGeneratedDaySession(storageKey, generated);
      requestKeyRef.current = null;
    } catch (error) {
      if (roadmapDay && roadmapDay.tasks.length > 0) {
        console.warn("Day session generation failed, using roadmap demo tasks fallback:", error);
        const { demoGraph, legacySession } = buildDemoDaySession(roadmap, roadmapDay, dayNumber);
        setDaySessionWithGraph(storageKey, legacySession, demoGraph);
        setSessionError(null);
        return;
      }
      setSessionError(error instanceof Error ? error.message : "Не удалось загрузить задачи. Попробуй ещё раз.");
    } finally {
      requestInFlightRef.current = false;
      setSessionLoading(false);
    }
  }, [allFocusGraphs, dayNumber, daySession, daySessions, graph.length, graphHasProgress, persistedRequestKey, roadmap, roadmapDay, saveGeneratedDaySession, setDaySessionRequestKey, setDaySessionWithGraph, storageKey]);

  useEffect(() => {
    if (daySession) return;
    if (graph.length > 0 && (graphHasProgress || !isBackendEnabled())) {
      const legacySession = adaptLegacyTaskGraphToSession({
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
        dayNumber,
        dayTitle: roadmapDay?.title ?? `День ${dayNumber}`,
        subskillId: roadmapDay?.subskillId,
        subskillDescription: roadmap.subskills?.find((item) => item.id === roadmapDay?.subskillId)?.description,
        graph,
      });
      setDaySession(storageKey, legacySession);
      return;
    }
    const timer = window.setTimeout(() => { void generateSession(); }, 0);
    return () => window.clearTimeout(timer);
  }, [dayNumber, daySession, generateSession, graph, graphHasProgress, roadmap.id, roadmap.title, roadmap.subskills, roadmapDay, setDaySession, storageKey]);
  
  const onComplete = useCallback((id: string, xp: number, sourceX: number, sourceY: number) => {
    if (!sessionReady || !taskIsAvailable(graph, id)) return;
    const completesDay = completesDayAt100Xp(graph, id);
    setCompletingId(id);
    setJustCompletedId(id);
    if (soundEnabled) {
      playTaskComplete();
      if (completesDay) window.setTimeout(playDayComplete, 75);
    }
    
    // Delay actual completion for animation
    setTimeout(() => {
      updateFocusGraph(storageKey, graph.map((task) => 
        task.id === id ? { ...task, status: "completed" } : task
      ));
      if (completesDay) markDaySessionCompleted(storageKey, new Date().toISOString());
      setCompletingId(null);
      
      // Show XP particles
      setShowParticles({ xp, x: sourceX, y: sourceY });
      setTimeout(() => setShowParticles(null), 1300);
      setTimeout(() => setJustCompletedId(null), 800);
    }, 600);
  }, [graph, markDaySessionCompleted, playDayComplete, playTaskComplete, sessionReady, soundEnabled, storageKey, updateFocusGraph]);
  
  const onSkip = useCallback((id: string) => {
    if (!sessionReady || !taskIsAvailable(graph, id)) return;
    updateFocusGraph(storageKey, graph.map((task) =>
      task.id === id ? { ...task, status: "skipped" } : task
    ));
  }, [graph, sessionReady, storageKey, updateFocusGraph]);
  
  const onSplit = useCallback(async (id: string) => {
    const parent = graph.find((task) => task.id === id);
    if (!sessionReady || !parent || parent.type !== "task" || !taskIsAvailable(graph, id)) return;
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
      const parentMetadata = daySession?.tasks.find((task) => task.taskId === parent.id);
      const childrenMetadata: StoredDailySessionTask[] = candidate
        .filter((node) => node.parent_id === parent.id && node.type === "task")
        .map((child) => ({
          taskId: child.id,
          durationSeconds: child.duration_minutes * 60,
          cognitiveRole: parentMetadata?.cognitiveRole ?? "FAST_FEEDBACK_DRILL",
          icnuTrigger: parentMetadata?.icnuTrigger ?? ICNU_MODIFIERS[0],
          instruction: child.title,
          evidenceMethod: `Проверь результат шага «${child.title}».`,
        }));
      addDaySessionTaskMetadata(storageKey, childrenMetadata);
    } catch (error) {
      setSplitError(error instanceof Error ? error.message : "Не удалось раздробить задачу. Попробуй ещё раз.");
    } finally {
      setSplittingId(null);
    }
  }, [addDaySessionTaskMetadata, daySession, graph, sessionReady, storageKey, updateFocusGraph]);
  
  const { nodes, edges } = useMemo(() => 
    arrangeGraph(graph, metadataByTaskId, onComplete, onSkip, onSplit, splittingId, completingId, justCompletedId, !sessionReady),
    [graph, metadataByTaskId, onComplete, onSkip, onSplit, splittingId, completingId, justCompletedId, sessionReady]
  );
  
  const xp = completedLeafXp(graph);
  const pending = graph.filter((task) => task.type === "task" && task.status === "pending").length;
  const graphMissing = graph.length === 0;
  const currentNode = nodes.find((node) => node.data.current);
  const cameraNodeIds = currentNode?.data.task.parent_id
    ? nodes.filter((node) => node.data.task.parent_id === currentNode.data.task.parent_id || node.id === currentNode.data.task.parent_id).map((node) => node.id)
    : currentNode ? [currentNode.id] : [];
  
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

      {isSessionLoading && graph.length > 0 && (
        <div className="focus-hint" role="status" aria-live="polite">
          <span className="split-spinner" aria-hidden="true" /> Обновляем сессию дня…
        </div>
      )}
      {sessionError && graph.length > 0 && (
        <div className="split-error" role="alert">
          <span>{sessionError}</span>
          <button type="button" onClick={() => void generateSession()}>Повторить</button>
        </div>
      )}
      
      <div className="flow-stage" data-testid="task-graph" data-node-count={nodes.length}>
        {graphMissing && isSessionLoading ? (
          <div className="graph-empty" role="status" aria-live="polite">
            <span className="split-spinner" aria-hidden="true" />
            <strong>Готовим сессию дня…</strong>
            <span>Подбираем короткие шаги для этого поднавыка.</span>
          </div>
        ) : graphMissing && sessionError ? (
          <div className="graph-empty" role="alert">
            <strong>Не удалось загрузить задачи</strong>
            <span>{sessionError}</span>
            <button type="button" onClick={() => void generateSession()}>Повторить</button>
          </div>
        ) : graphMissing ? (
          <div className="graph-empty" role="alert">
            <strong>Сессия сохранена, но граф не найден</strong>
            <span>Вернись к карте и открой день ещё раз. Прогресс не перезаписан.</span>
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
          <FocusCamera nodeIds={cameraNodeIds} />
            <Background color="var(--canvas-dot)" gap={22} size={1} />
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
