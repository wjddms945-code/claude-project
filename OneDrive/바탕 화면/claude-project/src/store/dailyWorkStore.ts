import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DailyWorkLog, DailyWorkProject, DailyWorkItem } from '../types';
import {
  sampleDailyWorkLogs,
  sampleDailyWorkProjects,
  sampleDailyWorkItems,
} from '../data/sampleData';

interface DailyWorkStoreState {
  logs: DailyWorkLog[];
  projects: DailyWorkProject[];
  items: DailyWorkItem[];

  // Logs
  addLog: (log: DailyWorkLog) => void;
  updateLog: (id: string, updates: Partial<DailyWorkLog>) => void;
  deleteLog: (id: string) => void;
  getLogById: (id: string) => DailyWorkLog | undefined;
  getLogByDate: (date: string) => DailyWorkLog | undefined;

  // Projects
  addProject: (project: DailyWorkProject) => void;
  updateProject: (id: string, updates: Partial<DailyWorkProject>) => void;
  removeProject: (id: string) => void;
  getProjectsByLogId: (logId: string) => DailyWorkProject[];

  // Items
  addItem: (item: DailyWorkItem) => void;
  updateItem: (id: string, updates: Partial<DailyWorkItem>) => void;
  removeItem: (id: string) => void;
  getItemsByProjectId: (projectId: string) => DailyWorkItem[];

  // Computed
  getTotalMinutesByLogId: (logId: string) => number;
}

export const useDailyWorkStore = create<DailyWorkStoreState>()(
  persist(
    (set, get) => ({
      logs: sampleDailyWorkLogs,
      projects: sampleDailyWorkProjects,
      items: sampleDailyWorkItems,

      addLog: (log) =>
        set((state) => ({ logs: [log, ...state.logs] })),

      updateLog: (id, updates) =>
        set((state) => ({
          logs: state.logs.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
          ),
        })),

      getLogById: (id) => get().logs.find((l) => l.id === id),

      getLogByDate: (date) => get().logs.find((l) => l.workDate === date),

      deleteLog: (id) =>
        set((state) => {
          const projectIds = state.projects
            .filter((p) => p.dailyWorkLogId === id)
            .map((p) => p.id);
          return {
            logs: state.logs.filter((l) => l.id !== id),
            projects: state.projects.filter((p) => p.dailyWorkLogId !== id),
            items: state.items.filter((i) => !projectIds.includes(i.dailyWorkProjectId)),
          };
        }),

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          items: state.items.filter((i) => i.dailyWorkProjectId !== id),
        })),

      getProjectsByLogId: (logId) =>
        get()
          .projects.filter((p) => p.dailyWorkLogId === logId)
          .sort((a, b) => a.sortOrder - b.sortOrder),

      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      getItemsByProjectId: (projectId) =>
        get()
          .items.filter((i) => i.dailyWorkProjectId === projectId)
          .sort((a, b) => a.sortOrder - b.sortOrder),

      getTotalMinutesByLogId: (logId) => {
        const state = get();
        const projectIds = state.projects
          .filter((p) => p.dailyWorkLogId === logId)
          .map((p) => p.id);
        return state.items
          .filter((i) => projectIds.includes(i.dailyWorkProjectId))
          .reduce((sum, i) => sum + i.durationMinutes, 0);
      },
    }),
    {
      name: 'work-logger-daily-work',
    }
  )
);
