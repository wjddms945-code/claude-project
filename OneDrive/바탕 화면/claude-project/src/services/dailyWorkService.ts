// This service layer abstracts data operations.
// Currently uses the Zustand store directly.
// To connect a real backend, replace the store calls with fetch/axios calls.

import { DailyWorkLog, DailyWorkProject, DailyWorkItem, WorkStatus } from '../types';
import { useDailyWorkStore } from '../store/dailyWorkStore';
import { generateLmsText } from '../utils/lmsGenerator';
import { getWorkMinutesByDate } from '../utils/timeUtils';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface SaveDailyWorkInput {
  workDate: string;
  workStatus: WorkStatus;
  projects: Array<{
    projectName: string;
    items: Array<{
      category: DailyWorkItem['category'];
      workText: string;
      inputHour: number;
      inputMinute: number;
    }>;
  }>;
}

export const dailyWorkService = {
  getLogByDate: async (date: string): Promise<DailyWorkLog | undefined> => {
    return useDailyWorkStore.getState().getLogByDate(date);
  },

  getLogById: async (id: string): Promise<DailyWorkLog | undefined> => {
    return useDailyWorkStore.getState().getLogById(id);
  },

  getAllLogs: async (): Promise<DailyWorkLog[]> => {
    return useDailyWorkStore.getState().logs;
  },

  getProjectsByLogId: async (logId: string): Promise<DailyWorkProject[]> => {
    return useDailyWorkStore.getState().getProjectsByLogId(logId);
  },

  getItemsByProjectId: async (projectId: string): Promise<DailyWorkItem[]> => {
    return useDailyWorkStore.getState().getItemsByProjectId(projectId);
  },

  saveDailyWork: async (input: SaveDailyWorkInput): Promise<DailyWorkLog> => {
    const store = useDailyWorkStore.getState();
    const now = new Date().toISOString();
    const TOTAL_WORK_MINUTES = getWorkMinutesByDate(input.workDate); // 금요일 240분, 그 외 480분

    // Check if a log already exists for this date
    const existingLog = store.getLogByDate(input.workDate);

    // Build project/item structures
    const newProjects: DailyWorkProject[] = [];
    const newItems: DailyWorkItem[] = [];

    let totalMinutes = 0;

    const logId = existingLog ? existingLog.id : generateId();

    input.projects.forEach((proj, projIndex) => {
      const projectId = generateId();
      newProjects.push({
        id: projectId,
        dailyWorkLogId: logId,
        projectName: proj.projectName,
        sortOrder: projIndex + 1,
      });

      proj.items.forEach((item, itemIndex) => {
        const durationMinutes = item.inputHour * 60 + item.inputMinute;
        totalMinutes += durationMinutes;
        newItems.push({
          id: generateId(),
          dailyWorkProjectId: projectId,
          category: item.category,
          workText: item.workText,
          inputHour: item.inputHour,
          inputMinute: item.inputMinute,
          durationMinutes,
          sortOrder: itemIndex + 1,
        });
      });
    });

    // Build LMS text from new data
    const itemsByProject: Record<string, DailyWorkItem[]> = {};
    newProjects.forEach((proj) => {
      itemsByProject[proj.id] = newItems.filter((i) => i.dailyWorkProjectId === proj.id);
    });
    const lmsExportText = generateLmsText(newProjects, itemsByProject);

    const remainingMinutes = Math.max(0, TOTAL_WORK_MINUTES - totalMinutes);

    if (existingLog) {
      // Remove old projects and their items, then add new ones
      const oldProjects = store.getProjectsByLogId(existingLog.id);
      oldProjects.forEach((p) => store.removeProject(p.id));

      newProjects.forEach((p) => store.addProject(p));
      newItems.forEach((i) => store.addItem(i));

      store.updateLog(existingLog.id, {
        workStatus: input.workStatus,
        totalMinutes,
        remainingMinutes,
        lmsExportText,
      });

      return store.getLogById(existingLog.id)!;
    } else {
      const newLog: DailyWorkLog = {
        id: logId,
        workDate: input.workDate,
        workStatus: input.workStatus,
        totalMinutes,
        remainingMinutes,
        lmsExportText,
        isLmsCopied: false,
        createdAt: now,
        updatedAt: now,
      };
      store.addLog(newLog);
      newProjects.forEach((p) => store.addProject(p));
      newItems.forEach((i) => store.addItem(i));
      return newLog;
    }
  },

  deleteDailyWork: async (logId: string): Promise<void> => {
    useDailyWorkStore.getState().deleteLog(logId);
  },
};
