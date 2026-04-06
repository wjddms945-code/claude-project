// This service layer abstracts data operations.
// Currently uses the Zustand store directly.
// To connect a real backend, replace the store calls with fetch/axios calls.

import { Meeting, MeetingNote, MeetingResult, MeetingActionItem, MeetingType } from '../types';
import { useMeetingStore } from '../store/meetingStore';

export interface CreateMeetingInput {
  title: string;
  projectName: string;
  meetingType: MeetingType;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const meetingService = {
  createMeeting: async (input: CreateMeetingInput): Promise<Meeting> => {
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: generateId(),
      title: input.title,
      projectName: input.projectName,
      meetingType: input.meetingType,
      startedAt: now,
      endedAt: null,
      durationMinutes: null,
      status: '진행중',
      createdAt: now,
      updatedAt: now,
    };
    useMeetingStore.getState().addMeeting(meeting);
    return meeting;
  },

  endMeeting: async (id: string): Promise<Meeting> => {
    useMeetingStore.getState().endMeeting(id);
    const meeting = useMeetingStore.getState().getMeetingById(id);
    if (!meeting) throw new Error(`Meeting ${id} not found`);
    return meeting;
  },

  getMeetingById: async (id: string): Promise<Meeting | undefined> => {
    return useMeetingStore.getState().getMeetingById(id);
  },

  getAllMeetings: async (): Promise<Meeting[]> => {
    return useMeetingStore.getState().meetings;
  },

  addNote: async (note: Omit<MeetingNote, 'id' | 'createdAt'>): Promise<MeetingNote> => {
    const newNote: MeetingNote = {
      ...note,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    useMeetingStore.getState().addNote(newNote);
    return newNote;
  },

  getNotesByMeetingId: async (meetingId: string): Promise<MeetingNote[]> => {
    return useMeetingStore.getState().getNotesByMeetingId(meetingId);
  },

  getResultByMeetingId: async (meetingId: string): Promise<MeetingResult | undefined> => {
    return useMeetingStore.getState().getResultByMeetingId(meetingId);
  },

  getActionItemsByMeetingId: async (meetingId: string): Promise<MeetingActionItem[]> => {
    return useMeetingStore.getState().getActionItemsByMeetingId(meetingId);
  },

  // Stub for AI-powered result generation
  generateResult: async (meetingId: string): Promise<MeetingResult> => {
    const notes = useMeetingStore.getState().getNotesByMeetingId(meetingId);
    const meeting = useMeetingStore.getState().getMeetingById(meetingId);
    if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

    const now = new Date().toISOString();
    const noteTexts = notes.map((n) => `- ${n.noteText}`).join('\n');

    // In production this would call an AI API
    const result: MeetingResult = {
      id: generateId(),
      meetingId,
      summaryOneLine: `${meeting.title} 회의 결과 요약`,
      overview: `${meeting.title} 회의가 진행되었습니다.\n\n회의 메모:\n${noteTexts || '(메모 없음)'}`,
      conclusionAgreements: '회의에서 논의된 주요 합의 사항입니다.',
      conclusionNextSteps: '다음 단계 액션 아이템을 확인해주세요.',
      discussionPoints: [
        {
          id: generateId(),
          topic: '주요 논의 사항',
          content: noteTexts || '회의 메모를 참고하세요.',
        },
      ],
      transcriptText: notes
        .map((n) => `[${new Date(n.createdAt).toLocaleTimeString('ko-KR')}] ${n.noteText}`)
        .join('\n'),
      createdAt: now,
      updatedAt: now,
    };

    useMeetingStore.getState().setResult(result);

    // Mark meeting as completed
    useMeetingStore.getState().updateMeeting(meetingId, { status: '완료' });

    return result;
  },

  deleteMeeting: async (id: string): Promise<void> => {
    useMeetingStore.getState().removeMeeting(id);
  },
};
