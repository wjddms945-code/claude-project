// 주간보고 자동생성 유틸리티
// 업무일지 누적 데이터를 기반으로 선택한 주(월~금)의 업무를 프로젝트별로 집계

import { DailyWorkLog, DailyWorkProject, DailyWorkItem } from '../types';

// ── 타입 ──────────────────────────────────────────────

export interface WeeklyReportRow {
  projectName: string;
  progressText: string; // 금주 진행내용 (줄바꿈 포함)
  status: string;       // 진행중 / 완료 / 검토중 / 작업중 / 확인중
}

export interface WeeklyReportResult {
  weekStart: string; // YYYY-MM-DD (월요일)
  weekEnd: string;   // YYYY-MM-DD (금요일)
  rows: WeeklyReportRow[];
}

// ── 날짜 유틸 ─────────────────────────────────────────

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 기준일이 속한 주의 월요일 Date 반환 */
export function getWeekMonday(ref: Date): Date {
  const d = new Date(ref);
  const dow = d.getDay(); // 0=일, 1=월 ... 6=토
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** YYYY-MM-DD → M/D(요일) 형식 */
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`;
}

/** weekStart/weekEnd → "2026년 1월 5일(월) ~ 1월 9일(금)" */
export function formatWeekRangeLabel(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + 'T00:00:00');
  const e = new Date(weekEnd + 'T00:00:00');
  return (
    `${s.getFullYear()}년 ${s.getMonth() + 1}월 ${s.getDate()}일(월)` +
    ` ~ ${e.getMonth() + 1}월 ${e.getDate()}일(금)`
  );
}

// ── 상태 추론 (키워드 규칙 기반) ─────────────────────

/** 업무 텍스트 목록에서 키워드 규칙으로 상태 추론 */
function inferStatus(texts: string[]): string {
  const combined = texts.join(' ');

  const has = (keywords: string[]) =>
    keywords.some((k) => combined.includes(k));

  if (has(['완료', '마무리', '완성', '배포', '종료', '최종 확정', '확정', '납품']))
    return '완료';
  if (has(['검토', '리뷰', '피드백', '확인 요청', '검수', '승인 요청']))
    return '검토중';
  if (has(['대기', '홀딩', '보류', '확인 중', '확인중', '개발 요청']))
    return '확인중';
  if (has(['개발중', '구현', '작업 중', '작업중', '작성 중']))
    return '작업중';
  return '진행중';
}

// ── 핵심 생성 함수 ────────────────────────────────────

export function generateWeeklyReport(
  referenceDate: Date,
  logs: DailyWorkLog[],
  projects: DailyWorkProject[],
  items: DailyWorkItem[]
): WeeklyReportResult {
  // 주간 범위 계산 (월~금)
  const monday = getWeekMonday(referenceDate);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const weekStart = toDateStr(monday);
  const weekEnd = toDateStr(friday);

  // 해당 주 로그 필터
  const weekLogs = logs
    .filter((l) => l.workDate >= weekStart && l.workDate <= weekEnd)
    .sort((a, b) => a.workDate.localeCompare(b.workDate));

  // 프로젝트명 → 업무 엔트리 목록
  const projectMap = new Map<
    string,
    { dateStr: string; text: string }[]
  >();

  for (const log of weekLogs) {
    const logProjects = projects
      .filter((p) => p.dailyWorkLogId === log.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const proj of logProjects) {
      const projName = proj.projectName.trim() || '미지정 프로젝트';
      const projItems = items
        .filter((i) => i.dailyWorkProjectId === proj.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (projItems.length === 0) continue;

      const existing = projectMap.get(projName) ?? [];
      for (const item of projItems) {
        const text = item.workText.trim();
        if (text) {
          existing.push({ dateStr: log.workDate, text });
        }
      }
      projectMap.set(projName, existing);
    }
  }

  // 행 생성
  const rows: WeeklyReportRow[] = [];

  for (const [projectName, entries] of projectMap.entries()) {
    if (entries.length === 0) continue;

    // 완전 동일 텍스트 중복 제거
    const seen = new Set<string>();
    const unique = entries.filter((e) => {
      const key = e.dateStr + '::' + e.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 날짜별로 그룹화
    const byDate = new Map<string, string[]>();
    for (const e of unique) {
      const list = byDate.get(e.dateStr) ?? [];
      list.push(e.text);
      byDate.set(e.dateStr, list);
    }

    // 날짜 오름차순으로 정렬된 진행내용 텍스트 조합
    const progressLines: string[] = [];
    for (const [dateStr, texts] of [...byDate.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      progressLines.push(`${formatDateLabel(dateStr)}: ${texts.join(' / ')}`);
    }

    const progressText = progressLines.join('\n');
    const status = inferStatus(unique.map((e) => e.text));

    rows.push({ projectName, progressText, status });
  }

  return { weekStart, weekEnd, rows };
}

// ── 출력 형태 생성 ────────────────────────────────────

/** 일반 텍스트 (셀 붙여넣기용) */
export function toPlainText(result: WeeklyReportResult): string {
  if (result.rows.length === 0) return '해당 주에 업무 기록이 없습니다.';

  const header = `📋 주간보고 (${formatWeekRangeLabel(result.weekStart, result.weekEnd)})`;
  const lines: string[] = [header, ''];

  for (const row of result.rows) {
    lines.push(`■ ${row.projectName}`);
    lines.push('금주 진행내용:');
    row.progressText.split('\n').forEach((l) => lines.push(`  ${l}`));
    lines.push(`상태: ${row.status}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

/** TSV 텍스트 (엑셀 컬럼 붙여넣기용) */
export function toTsvText(result: WeeklyReportResult): string {
  if (result.rows.length === 0) return '';

  const escapeTsvCell = (text: string): string => {
    if (text.includes('\n') || text.includes('\t') || text.includes('"')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rowData = result.rows.map((r) => escapeTsvCell(r.progressText)).join('\n');
  return rowData;
}

// ── 월간보고 타입 ─────────────────────────────────────

export interface MonthlyReportResult {
  year: number;
  month: number; // 1-based
  rows: WeeklyReportRow[]; // 동일 행 구조 재사용
}

// ── 월간보고 생성 함수 ────────────────────────────────

/**
 * 선택한 연도/월의 업무일지 데이터를 프로젝트별로 집계해 월간보고를 생성.
 * 주간보고와 동일한 그룹핑/중복제거/상태추론 로직을 재사용.
 * 진행내용은 해당 월 안에서 주차(N주차) 단위로 묶어서 정리.
 */
export function generateMonthlyReport(
  year: number,
  month: number, // 1-based
  logs: DailyWorkLog[],
  projects: DailyWorkProject[],
  items: DailyWorkItem[]
): MonthlyReportResult {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // 해당 월 로그만 필터 (날짜순)
  const monthLogs = logs
    .filter((l) => l.workDate.startsWith(monthStr))
    .sort((a, b) => a.workDate.localeCompare(b.workDate));

  // 프로젝트명 → 업무 엔트리 목록 (주간보고 로직과 동일)
  const projectMap = new Map<string, { dateStr: string; text: string }[]>();

  for (const log of monthLogs) {
    const logProjects = projects
      .filter((p) => p.dailyWorkLogId === log.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    for (const proj of logProjects) {
      const projName = proj.projectName.trim() || '미지정 프로젝트';
      const projItems = items
        .filter((i) => i.dailyWorkProjectId === proj.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (projItems.length === 0) continue;

      const existing = projectMap.get(projName) ?? [];
      for (const item of projItems) {
        const text = item.workText.trim();
        if (text) existing.push({ dateStr: log.workDate, text });
      }
      projectMap.set(projName, existing);
    }
  }

  const rows: WeeklyReportRow[] = [];

  for (const [projectName, entries] of projectMap.entries()) {
    if (entries.length === 0) continue;

    // 완전 동일 텍스트 중복 제거 (날짜+텍스트 조합 기준)
    const seen = new Set<string>();
    const unique = entries.filter((e) => {
      const key = e.dateStr + '::' + e.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 주차 그룹핑: 날짜(일) 기준 고정 규칙 (1~7일=1주차, 8~14일=2주차, ... 29일~=5주차)
    const weekMap = new Map<number, string[]>(); // weekNum → texts
    for (const e of unique) {
      const d = new Date(e.dateStr + 'T00:00:00').getDate();
      const weekNum = Math.min(5, Math.ceil(d / 7));
      const list = weekMap.get(weekNum) ?? [];
      list.push(e.text);
      weekMap.set(weekNum, list);
    }

    // 주차 오름차순 정렬
    const sortedWeeks = [...weekMap.entries()].sort((a, b) => a[0] - b[0]);

    const progressLines: string[] = [];
    sortedWeeks.forEach(([weekNum, texts]) => {
      // 주차 내 동일 텍스트 중복 제거 + 공백 정리
      const cleansed = texts
        .map((t) => t.replace(/\s+/g, ' ').trim())
        .filter((t) => t);
      const dedupedTexts = [...new Set(cleansed)];
      if (dedupedTexts.length === 0) return;

      // 주차 헤더
      if (progressLines.length > 0) {
        progressLines.push('');
      }
      progressLines.push(`[${weekNum}주차]`);

      // 같은 날짜별로 묶음
      const byDate = new Map<string, string[]>();
      const monthDay = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return `${d.getMonth() + 1}/${d.getDate()}`;
      };

      // 추출 순서는 원본 unique에서 날짜 순서 상관 없는 검증이므로, weekMap에 쌓일 때 순서 보장됨.
      // 날짜 정리: d.getDate() 기준 오름차순
      for (const e of unique) {
        const d = new Date(e.dateStr + 'T00:00:00');
        const weekKey = Math.min(5, Math.ceil(d.getDate() / 7));
        if (weekKey !== weekNum) continue;
        const list = byDate.get(e.dateStr) ?? [];
        list.push(e.text.replace(/\s+/g, ' ').trim());
        byDate.set(e.dateStr, list);
      }

      const sortedDates = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      for (const [dateStr, dayTexts] of sortedDates) {
        const uniqDayTexts = [...new Set(dayTexts.filter((t) => t))];
        if (uniqDayTexts.length === 0) continue;

        progressLines.push(`[${monthDay(dateStr)}]`);
        uniqDayTexts.forEach((text) => {
          progressLines.push(`- ${text}`);
        });
        progressLines.push('');
      }

      if (progressLines[progressLines.length - 1] === '') {
        progressLines.pop();
      }
    });

    rows.push({
      projectName,
      progressText: progressLines.join('\n'),
      status: inferStatus(unique.map((e) => e.text)),
    });
  }

  return { year, month, rows };
}

// ── 월간보고 출력 형태 생성 ───────────────────────────

/** 월간보고 일반 텍스트 (셀 붙여넣기용) */
export function toMonthlyPlainText(result: MonthlyReportResult): string {
  if (result.rows.length === 0) return '해당 월에 업무 기록이 없습니다.';

  const header = `📋 월간보고 (${result.year}년 ${result.month}월)`;
  const lines: string[] = [header, ''];

  for (const row of result.rows) {
    lines.push(`■ ${row.projectName}`);
    lines.push('월간 진행내용:');
    row.progressText.split('\n').forEach((l) => lines.push(`  ${l}`));
    lines.push(`상태: ${row.status}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

/** 월간보고 TSV 텍스트 (엑셀 컬럼 붙여넣기용) */
export function toMonthlyTsvText(result: MonthlyReportResult): string {
  if (result.rows.length === 0) return '';

  const escapeCell = (text: string) =>
    text.includes('\n') || text.includes('\t') || text.includes('"')
      ? `"${text.replace(/"/g, '""')}"`
      : text;

  const rowData = result.rows.map((r) => escapeCell(r.progressText)).join('\n');
  return rowData;
}
