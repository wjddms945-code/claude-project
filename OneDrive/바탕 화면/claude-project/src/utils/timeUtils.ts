const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0분';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}시간 ${mins}분`;
  if (hours > 0) return `${hours}시간`;
  return `${mins}분`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayName = DAY_NAMES[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}

export function formatDateShort(isoString: string): string {
  const date = new Date(isoString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

export function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function formatTimerDisplay(seconds: number): string {
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getElapsedMinutes(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 60000);
}

/**
 * 날짜 기준 기준 근무시간(분) 반환
 * 금요일(5): 4시간 = 240분 | 그 외: 8시간 = 480분
 * dateStr 형식: YYYY-MM-DD
 */
export function getWorkMinutesByDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === 5 ? 240 : 480;
}

export function getDailyWorkStatus(
  totalMinutes: number,
  workStatus: string,
  dateStr?: string
): string {
  const goalMinutes = dateStr ? getWorkMinutesByDate(dateStr) : 480;
  const completionThreshold = Math.floor(goalMinutes * 0.9);
  if (totalMinutes >= completionThreshold) return '작성 완료';
  if (workStatus === '반차') return '반차';
  if (workStatus === '연차') return '연차';
  return '작성 필요';
}

export function formatDateFromYMD(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAY_NAMES[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayName})`;
}
