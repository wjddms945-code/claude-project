import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Meeting,
  MeetingNote,
  MeetingResult,
  MeetingActionItem,
  ActionItemStatus,
} from '../types';
import {
  sampleMeetings,
  sampleNotes,
  sampleResults,
  sampleActionItems,
} from '../data/sampleData';

interface MeetingStoreState {
  meetings: Meeting[];
  notes: MeetingNote[];
  results: MeetingResult[];
  actionItems: MeetingActionItem[];

  // Meeting CRUD
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  removeMeeting: (id: string) => void;
  getMeetingById: (id: string) => Meeting | undefined;

  // Notes
  addNote: (note: MeetingNote) => void;
  getNotesByMeetingId: (meetingId: string) => MeetingNote[];

  // Results
  setResult: (result: MeetingResult) => void;
  getResultByMeetingId: (meetingId: string) => MeetingResult | undefined;

  // Action Items
  addActionItem: (item: MeetingActionItem) => void;
  updateActionItemStatus: (id: string, status: ActionItemStatus) => void;
  getActionItemsByMeetingId: (meetingId: string) => MeetingActionItem[];

  // End meeting
  endMeeting: (id: string) => void;
}

export const useMeetingStore = create<MeetingStoreState>()(
  persist(
    (set, get) => ({
      meetings: sampleMeetings,
      notes: sampleNotes,
      results: sampleResults,
      actionItems: sampleActionItems,

      addMeeting: (meeting) =>
        set((state) => ({ meetings: [meeting, ...state.meetings] })),

      updateMeeting: (id, updates) =>
        set((state) => ({
          meetings: state.meetings.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
          ),
        })),

      getMeetingById: (id) => get().meetings.find((m) => m.id === id),

      removeMeeting: (id) =>
        set((state) => ({
          meetings: state.meetings.filter((m) => m.id !== id),
          notes: state.notes.filter((n) => n.meetingId !== id),
          results: state.results.filter((r) => r.meetingId !== id),
          actionItems: state.actionItems.filter((item) => item.meetingId !== id),
        })),

      addNote: (note) =>
        set((state) => ({ notes: [...state.notes, note] })),

      getNotesByMeetingId: (meetingId) =>
        get().notes.filter((n) => n.meetingId === meetingId),

      setResult: (result) =>
        set((state) => {
          const existing = state.results.find((r) => r.meetingId === result.meetingId);
          if (existing) {
            return {
              results: state.results.map((r) =>
                r.meetingId === result.meetingId ? result : r
              ),
            };
          }
          return { results: [...state.results, result] };
        }),

      getResultByMeetingId: (meetingId) =>
        get().results.find((r) => r.meetingId === meetingId),

      addActionItem: (item) =>
        set((state) => ({ actionItems: [...state.actionItems, item] })),

      updateActionItemStatus: (id, status) =>
        set((state) => ({
          actionItems: state.actionItems.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        })),

      getActionItemsByMeetingId: (meetingId) =>
        get()
          .actionItems.filter((item) => item.meetingId === meetingId)
          .sort((a, b) => a.sortOrder - b.sortOrder),

      endMeeting: (id) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            meetings: state.meetings.map((m) => {
              if (m.id !== id) return m;
              const startedAt = new Date(m.startedAt);
              const endedAt = new Date(now);
              const durationMinutes = Math.round(
                (endedAt.getTime() - startedAt.getTime()) / 60000
              );
              return {
                ...m,
                endedAt: now,
                durationMinutes,
                status: '분석중' as const,
                updatedAt: now,
              };
            }),
          };
        }),
    }),
    {
      name: 'work-logger-meetings',
    }
  )
);
