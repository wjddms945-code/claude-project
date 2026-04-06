// 메인 홈의 주간/월간 활동 타임라인 컴포넌트
// - 기본: 이번 주 7일 가로 카드형 (날짜별 세로 카드)
// - 토글: 이번 달 전체 달력 보기 (테두리 셀 그리드)
// - 각 날짜 셀에 회의/업무/LMS 완료 상태를 점(dot)으로 표시
// - 날짜 클릭 시 해당 날의 기록 요약 인라인 노출

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import { useDailyWorkStore } from '../../store/dailyWorkStore';
import { getWorkMinutesByDate } from '../../utils/timeUtils';

// ── 타입 ──────────────────────────────────────────────
type ViewMode = 'week' | 'month';

interface DaySummary {
  dateStr: string;       // YYYY-MM-DD
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  meetingCount: number;
  hasWork: boolean;
  hasLms: boolean;
  isVacation: boolean;
  isGoodWork: boolean;   // 하루 업무 기록이 기준 시간의 90% 이상 (참잘했어요 조건)
}

// ── 달력 칩 조건 헬퍼 ─────────────────────────────────

/**
 * 날짜 기준 LMS 복사 완료 여부.
 * 신규·기존 날짜 구분 없이 isLmsCopied 플래그가 true인 경우에만 LMS 완료로 판단.
 * 구형 데이터(필드 없음)는 false로 처리.
 */
function isDayLmsCopied(log: { isLmsCopied?: boolean } | undefined): boolean {
  return !!log?.isLmsCopied;
}

/**
 * 하루 업무 기록이 해당 날짜 기준 근무시간의 90% 이상인지 여부.
 * - 금요일: 240분 × 90% = 216분 이상
 * - 그 외:  480분 × 90% = 432분 이상
 * 연차/반차인 날은 제외.
 */
function isDayGoodWork(
  log: { totalMinutes: number; workStatus: string; workDate: string } | undefined
): boolean {
  if (!log) return false;
  if (log.workStatus !== '근무') return false;
  const goalMinutes = getWorkMinutesByDate(log.workDate);
  const goodWorkMin = Math.floor(goalMinutes * 0.9);
  return log.totalMinutes >= goodWorkMin;
}

// ── 잘했어요 스탬프 컴포넌트 ───────────────────────

function GoodWorkStamp({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className="text-[7px] text-rose-400 font-bold leading-none"
        title="참잘했어요 (기준 시간 90% 이상 달성)"
      >
        ✦
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-rose-400 border border-rose-200 rounded px-1 py-0.5 leading-none"
      title="참잘했어요 (기준 시간 90% 이상 달성)"
    >
      ✦ 잘했어요
    </span>
  );
}

// ── 날짜 유틸 ────────────────────────────────────────
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 주어진 날짜가 속한 주의 월~일(7일) 배열 */
function getWeekDays(ref: Date): Date[] {
  const dow = ref.getDay(); // 0=일, 1=월, ...
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** 주어진 날짜가 속한 달의 전체 셀 (주 단위로 앞뒤 패딩 포함) */
function getMonthDays(ref: Date): Date[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDow = firstDay.getDay();
  const padBefore = startDow === 0 ? 6 : startDow - 1;

  const days: Date[] = [];
  for (let i = padBefore; i > 0; i--) {
    const d = new Date(firstDay);
    d.setDate(1 - i);
    days.push(d);
  }
  for (let d = new Date(firstDay); d <= lastDay; ) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    days.push(next);
  }
  return days;
}

// ── 컴포넌트 ─────────────────────────────────────────
export function WeeklyTimeline() {
  const navigate = useNavigate();
  const { meetings } = useMeetingStore();
  const { logs } = useDailyWorkStore();

  const [today] = useState(() => new Date());
  const todayStr = toDateStr(today);
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo<Date[]>(
    () => (viewMode === 'week' ? getWeekDays(today) : getMonthDays(today)),
    [viewMode, today]
  );

  const daySummaries = useMemo<DaySummary[]>(
    () =>
      days.map((date) => {
        const dateStr = toDateStr(date);
        const dayMeetings = meetings.filter((m) => m.startedAt.startsWith(dateStr));
        const dayLog = logs.find((l) => l.workDate === dateStr);
        return {
          dateStr,
          date,
          isToday: dateStr === todayStr,
          isCurrentMonth:
            date.getMonth() === todayMonth && date.getFullYear() === todayYear,
          meetingCount: dayMeetings.length,
          hasWork: !!dayLog && dayLog.totalMinutes > 0,
          hasLms: isDayLmsCopied(dayLog),
          isVacation: !!dayLog && dayLog.workStatus === '연차',
          isGoodWork: isDayGoodWork(dayLog),
        };
      }),
    [days, meetings, logs, todayStr, todayMonth, todayYear]
  );

  const selectedMeetings = selectedDay
    ? meetings.filter((m) => m.startedAt.startsWith(selectedDay))
    : [];
  const selectedLog = selectedDay
    ? logs.find((l) => l.workDate === selectedDay)
    : undefined;
  const selectedDate = selectedDay
    ? daySummaries.find((d) => d.dateStr === selectedDay)?.date
    : undefined;

  const handleDayClick = (dateStr: string) => {
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
  };

  const sectionTitle =
    viewMode === 'week'
      ? `${today.getFullYear()}년 ${today.getMonth() + 1}월 · 이번 주 활동`
      : `${today.getFullYear()}년 ${today.getMonth() + 1}월 활동`;

  // ── 활동 점 렌더 헬퍼 ────────────────────────────────
  const renderDots = (day: DaySummary) => {
    if (day.isVacation) {
      return (
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="text-[9px] text-gray-500 font-medium px-1 bg-gray-200/60 rounded">연차</span>
          {day.meetingCount > 0 && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-blue-700"
              title={`회의 ${day.meetingCount}건`}
            />
          )}
        </div>
      );
    }
    return (
      <div className="flex gap-0.5 items-center justify-center">
        {day.meetingCount > 0 && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-blue-700"
            title={`회의 ${day.meetingCount}건`}
          />
        )}
        {day.hasWork && !day.hasLms && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-blue-400"
            title="업무 기록"
          />
        )}
        {day.hasLms && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            title="LMS 완료"
          />
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">

      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{sectionTitle}</h2>
        <button
          onClick={() => {
            setViewMode((v) => (v === 'week' ? 'month' : 'week'));
            setSelectedDay(null);
          }}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded px-2.5 py-1 hover:bg-blue-50 transition-colors"
        >
          {viewMode === 'week' ? '월간 보기 ▾' : '주간 보기 ▴'}
        </button>
      </div>

      {/* ── 주간 뷰: 날짜별 세로 카드형 ── */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-7 gap-2">
          {daySummaries.map((day, idx) => {
            const isSelected = selectedDay === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => handleDayClick(day.dateStr)}
                className={[
                  'flex flex-col items-center justify-between rounded-xl border transition-all min-h-[88px] pt-3 pb-3 px-1 relative',
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-sm z-10'
                    : day.isToday
                    ? 'border-blue-200 bg-blue-50/50'
                    : day.isVacation
                    ? 'border-gray-200 bg-gray-50/50 opacity-70 hover:opacity-100 hover:border-gray-300'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {day.isToday && (
                  <span className={`absolute top-1 left-1.5 text-[9px] font-bold ${isSelected ? 'text-blue-600' : 'text-blue-400'}`}>
                    오늘
                  </span>
                )}
                {/* 요일 */}
                <span
                  className={`text-xs font-medium ${
                    isSelected ? 'text-blue-600' : day.isToday ? 'text-blue-500' : 'text-gray-400'
                  }`}
                >
                  {WEEKDAYS[idx]}
                </span>

                {/* 날짜 숫자 */}
                <span
                  className={`text-lg font-bold leading-none ${
                    isSelected ? 'text-blue-900' : day.isToday ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* 활동 점 + 참잘했어요 스탬프 — 하단 */}
                <div className="flex flex-col items-center gap-0.5">
                  {renderDots(day)}
                  {day.isGoodWork && <GoodWorkStamp />}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* ── 월간 뷰: 요일 헤더 + 테두리 셀 그리드 ── */
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daySummaries.map((day) => {
              const isSelected = selectedDay === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={[
                    'flex flex-col items-center justify-between rounded-lg border transition-all min-h-[52px] pt-1.5 pb-1.5 px-0.5 relative',
                    !day.isCurrentMonth ? 'opacity-25' : '',
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-sm z-10'
                      : day.isToday
                      ? 'border-blue-200 bg-blue-50/50'
                      : day.isVacation
                      ? 'border-gray-200 bg-gray-50/50 opacity-70 hover:opacity-100 hover:border-gray-300'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {day.isToday && (
                    <span className={`absolute top-0.5 left-0.5 text-[8px] font-bold tracking-tighter ${isSelected ? 'text-blue-600' : 'text-blue-400'}`}>
                      오늘
                    </span>
                  )}
                  <span
                    className={`text-xs font-medium leading-none ${
                      isSelected ? 'text-blue-900' : day.isToday ? 'text-blue-800' : 'text-gray-700'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  <div className="flex flex-col items-center gap-0.5 mt-1">
                    {renderDots(day)}
                    {day.isGoodWork && <GoodWorkStamp compact />}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 범례 */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-700" />
          <span className="text-xs text-gray-500">회의</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-gray-500">업무 기록</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-xs text-gray-500">LMS 완료</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-rose-400 border border-rose-200 rounded px-0.5 font-bold">✦</span>
          <span className="text-xs text-gray-500">클리어</span>
        </div>
      </div>

      {/* 날짜 클릭 시 상세 패널 */}
      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedDate?.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>

          {selectedMeetings.length === 0 && !selectedLog ? (
            <p className="text-sm text-gray-400">이 날의 기록이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedMeetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/meetings/${m.id}`)}
                  className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-700 shrink-0" />
                  <span className="text-xs text-blue-800 font-medium truncate">{m.title}</span>
                  {m.projectName && (
                    <span className="text-xs text-blue-500 shrink-0">· {m.projectName}</span>
                  )}
                </div>
              ))}
              {selectedLog && (
                <div
                  onClick={() => navigate(`/daily-work/${selectedLog.id}`)}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      selectedLog.workStatus === '연차' ? 'bg-gray-300' : selectedLog.isLmsCopied ? 'bg-gray-400' : 'bg-blue-400'
                    }`}
                  />
                  <span className={`text-xs font-medium ${selectedLog.workStatus === '연차' ? 'text-gray-500' : 'text-gray-700'}`}>
                    {selectedLog.workStatus === '연차' ? '연차 (업무 면제)' : '업무 기록'}
                  </span>
                  {selectedLog.workStatus !== '연차' && (
                    <>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{selectedLog.totalMinutes}분</span>
                    </>
                  )}
                  {selectedLog.isLmsCopied && selectedLog.workStatus !== '연차' && (
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                      LMS 완료
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
