// 공통 프로젝트 관리 Store
// 업무일지·회의 화면에서 공통으로 사용하는 프로젝트 목록을 관리한다.
// 추가/수정/삭제 가능하며 localStorage에 영속 저장된다.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_PROJECTS_DATA } from '../data/constants';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';

export interface ProjectEntry {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate?: string;      // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD
  goal?: string;           // 목표
  overview?: string;       // 개요
  expectedEffect?: string; // 기대효과
  planPercent: number;     // 기획 진행률 0-100
  designPercent: number;   // 디자인 진행률 0-100
  devPercent: number;      // 개발 진행률 0-100
  qaPercent: number;       // QA 진행률 0-100
  designOwner?: string;    // 디자인 담당자 (콤마 구분 복수 입력 가능)
  devOwner?: string;       // 개발 담당자
  qaOwner?: string;        // QA 담당자
  createdAt: string;
  updatedAt: string;
}

export type AddProjectInput = {
  name: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  goal?: string;
  overview?: string;
  expectedEffect?: string;
  planPercent?: number;
  designPercent?: number;
  devPercent?: number;
  qaPercent?: number;
};

interface ProjectStoreState {
  projects: ProjectEntry[];
  addProject: (input: AddProjectInput) => void;
  updateProject: (id: string, updates: Partial<Omit<ProjectEntry, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
}

const projectDefaults = {
  status: 'active' as ProjectStatus,
  planPercent: 0,
  designPercent: 0,
  devPercent: 0,
  qaPercent: 0,
};

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      projects: MOCK_PROJECTS_DATA.map((data, i) => ({
        id: `default-${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...projectDefaults,
        ...data,
      })),

      addProject: (input) =>
        set((state) => {
          const now = new Date().toISOString();
          const newEntry: ProjectEntry = {
            id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: input.name.trim(),
            status: input.status ?? 'planning',
            startDate: input.startDate,
            endDate: input.endDate,
            goal: input.goal,
            overview: input.overview,
            expectedEffect: input.expectedEffect,
            planPercent: input.planPercent ?? 0,
            designPercent: input.designPercent ?? 0,
            devPercent: input.devPercent ?? 0,
            qaPercent: input.qaPercent ?? 0,
            createdAt: now,
            updatedAt: now,
          };
          return { projects: [...state.projects, newEntry] };
        }),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),
    }),
    { name: 'work-logger-projects' }
  )
);

// 전체 진행률 계산 헬퍼
export function getOverallPercent(project: ProjectEntry): number {
  return Math.round(
    (project.planPercent + project.designPercent + project.devPercent + project.qaPercent) / 4
  );
}

// 상태 라벨/뱃지 헬퍼
export function getProjectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'planning': return '기획중';
    case 'active': return '진행중';
    case 'completed': return '완료';
    case 'paused': return '보류';
  }
}

export function getProjectStatusVariant(status: ProjectStatus): 'blue' | 'green' | 'gray' | 'yellow' {
  switch (status) {
    case 'planning': return 'yellow';
    case 'active': return 'blue';
    case 'completed': return 'green';
    case 'paused': return 'gray';
  }
}
