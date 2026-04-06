// ===== ENUMS =====

export type MeetingStatus = '진행중' | '분석중' | '완료' | '오류';
export type ActionItemStatus = '미실행' | '완료';
export type DailyWorkStatus = '작성 필요' | '작성 완료' | '반차' | '연차' | '미작성';
export type WorkStatus = '근무' | '반차' | '연차';

export type MeetingType = '내부회의' | '개발회의' | '디자인리뷰' | '보고회의' | '외부미팅';
export type WorkCategory = '회의' | '기획' | '메일공유' | '리서치' | '문서작업' | '엑셀시트정리' | '업무협조' | '모니터링' | '기타';
export type Priority = '최상위' | '상위' | '일반';

// ===== MEETING =====

export interface Meeting {
  id: string;
  title: string;
  projectName: string;
  meetingType: MeetingType;
  startedAt: string; // ISO string
  endedAt: string | null;
  durationMinutes: number | null;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNote {
  id: string;
  meetingId: string;
  noteText: string;
  isKeyPoint: boolean;
  createdAt: string;
}

export interface MeetingResult {
  id: string;
  meetingId: string;
  summaryOneLine: string;
  overview: string;
  conclusionAgreements: string;
  conclusionNextSteps: string;
  discussionPoints: DiscussionPoint[];
  transcriptText: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionPoint {
  id: string;
  topic: string;
  content: string;
}

export interface MeetingActionItem {
  id: string;
  meetingId: string;
  priorityDepth1: Priority;
  categoryDepth2: WorkCategory;
  taskDepth3: string;
  description: string;
  status: ActionItemStatus;
  sortOrder: number;
}

// ===== DAILY WORK =====

export interface DailyWorkLog {
  id: string;
  workDate: string; // YYYY-MM-DD
  workStatus: WorkStatus;
  totalMinutes: number;
  remainingMinutes: number;
  lmsExportText: string;
  isLmsCopied: boolean; // 사용자가 실제 LMS 복사 버튼을 클릭한 경우에만 true
  createdAt: string;
  updatedAt: string;
}

export interface DailyWorkProject {
  id: string;
  dailyWorkLogId: string;
  projectName: string;
  sortOrder: number;
}

export interface DailyWorkItem {
  id: string;
  dailyWorkProjectId: string;
  category: WorkCategory;
  workText: string;
  inputHour: number;
  inputMinute: number;
  durationMinutes: number;
  sortOrder: number;
}

// ===== STORE SHAPES =====

export interface MeetingStore {
  meetings: Meeting[];
  notes: MeetingNote[];
  results: MeetingResult[];
  actionItems: MeetingActionItem[];
}

export interface DailyWorkStore {
  logs: DailyWorkLog[];
  projects: DailyWorkProject[];
  items: DailyWorkItem[];
}
