// 보고서 자동생성 페이지 (주간보고 / 월간보고 탭 전환)
// 업무일지 누적 데이터를 기반으로 프로젝트별 보고 내용을 자동 정리

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyWorkStore } from '../../../store/dailyWorkStore';
import { getTodayString } from '../../../utils/timeUtils';
import {
  generateWeeklyReport,
  toPlainText,
  toTsvText,
  getWeekMonday,
  formatWeekRangeLabel,
  WeeklyReportResult,
  generateMonthlyReport,
  toMonthlyPlainText,
  toMonthlyTsvText,
  MonthlyReportResult,
  WeeklyReportRow,
} from '../../../utils/weeklyReportGenerator';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';

// ── 공통 타입 ─────────────────────────────────────────
type ReportTab = 'week' | 'month';

// ── 공통 컴포넌트 ─────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  완료:   'bg-green-100 text-green-700',
  진행중: 'bg-blue-100 text-blue-700',
  검토중: 'bg-yellow-100 text-yellow-700',
  작업중: 'bg-purple-100 text-purple-700',
  확인중: 'bg-orange-100 text-orange-700',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

/** 주간/월간 공통 결과 테이블 */
function ReportTable({ rows }: { rows: WeeklyReportRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-48">
              프로젝트명
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
              진행내용
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-24">
              상태
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 align-top">
                <span className="font-medium text-gray-900 text-sm">{row.projectName}</span>
              </td>
              <td className="px-4 py-3 align-top">
                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {row.progressText}
                </div>
              </td>
              <td className="px-4 py-3 align-top">
                <StatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/** 텍스트 미리보기 섹션 (일반 / TSV 토글) */
function TextPreviewSection({
  plainText,
  tsvText,
}: {
  plainText: string;
  tsvText: string;
}) {
  const [open, setOpen] = useState<'plain' | 'tsv' | null>(null);
  const [copied, setCopied] = useState(false);

  const currentText = open === 'plain' ? plainText : open === 'tsv' ? tsvText : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">텍스트 미리보기</span>
        <button
          onClick={() => { setOpen(open === 'plain' ? null : 'plain'); setCopied(false); }}
          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
            open === 'plain'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          일반 텍스트
        </button>
        <button
          onClick={() => { setOpen(open === 'tsv' ? null : 'tsv'); setCopied(false); }}
          className={`text-xs px-2.5 py-1 rounded border transition-colors ${
            open === 'tsv'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          TSV (엑셀용)
        </button>
      </div>
      {open ? (
        <div className="relative">
          <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-auto max-h-60">
            {currentText}
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 text-xs text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded px-2 py-1 transition-colors"
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400">위 버튼을 눌러 출력 텍스트를 미리 확인하세요.</p>
      )}
    </Card>
  );
}

// ── 주간보고 패널 ─────────────────────────────────────

function WeeklyPanel() {
  const { logs, projects, items } = useDailyWorkStore();

  const [refDate, setRefDate] = useState(getTodayString());
  const [result, setResult] = useState<WeeklyReportResult | null>(null);
  const [plainCopied, setPlainCopied] = useState(false);
  const [tsvCopied, setTsvCopied] = useState(false);

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const previewMonday = getWeekMonday(new Date(refDate + 'T00:00:00'));
  const previewFriday = new Date(previewMonday);
  previewFriday.setDate(previewMonday.getDate() + 4);
  const previewRange = formatWeekRangeLabel(toStr(previewMonday), toStr(previewFriday));

  const handleGenerate = () => {
    setResult(generateWeeklyReport(new Date(refDate + 'T00:00:00'), logs, projects, items));
    setPlainCopied(false);
    setTsvCopied(false);
  };

  const handleCopy = async (type: 'plain' | 'tsv') => {
    if (!result) return;
    const text = type === 'plain' ? toPlainText(result) : toTsvText(result);
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'plain') { setPlainCopied(true); setTimeout(() => setPlainCopied(false), 2000); }
      else { setTsvCopied(true); setTimeout(() => setTsvCopied(false), 2000); }
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* 기준 날짜 선택 */}
      <Card>
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">기준 날짜</label>
            <input
              type="date"
              value={refDate}
              onChange={(e) => { setRefDate(e.target.value); setResult(null); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">집계 기간</p>
            <p className="text-sm font-medium text-blue-700">{previewRange}</p>
          </div>
          <Button variant="primary" size="lg" onClick={handleGenerate}>
            주간보고 생성
          </Button>
        </div>
      </Card>

      {/* 결과 */}
      {result && (
        result.rows.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">해당 주에 업무 기록이 없습니다.</p>
              <p className="text-gray-400 text-xs mt-1">
                {formatWeekRangeLabel(result.weekStart, result.weekEnd)} 기간의 업무일지를 먼저 작성해주세요.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {formatWeekRangeLabel(result.weekStart, result.weekEnd)}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  프로젝트 {result.rows.length}개 · 이번 주 실제 진행 내용 기준
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleCopy('plain')}>
                  {plainCopied ? '복사됨 ✓' : '일반 복사'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleCopy('tsv')}>
                  {tsvCopied ? '복사됨 ✓' : 'TSV 복사 (엑셀용)'}
                </Button>
              </div>
            </div>
            <ReportTable rows={result.rows} />
            <TextPreviewSection
              plainText={toPlainText(result)}
              tsvText={toTsvText(result)}
            />
          </>
        )
      )}
    </div>
  );
}

// ── 월간보고 패널 ─────────────────────────────────────

function MonthlyPanel() {
  const { logs, projects, items } = useDailyWorkStore();

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1); // 1-based
  const [result, setResult] = useState<MonthlyReportResult | null>(null);
  const [plainCopied, setPlainCopied] = useState(false);
  const [tsvCopied, setTsvCopied] = useState(false);

  // 연도 선택지: 최근 3년
  const yearOptions = [now.getFullYear() - 1, now.getFullYear()];

  const handleGenerate = () => {
    setResult(generateMonthlyReport(selYear, selMonth, logs, projects, items));
    setPlainCopied(false);
    setTsvCopied(false);
  };

  const handleCopy = async (type: 'plain' | 'tsv') => {
    if (!result) return;
    const text = type === 'plain' ? toMonthlyPlainText(result) : toMonthlyTsvText(result);
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'plain') { setPlainCopied(true); setTimeout(() => setPlainCopied(false), 2000); }
      else { setTsvCopied(true); setTimeout(() => setTsvCopied(false), 2000); }
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      {/* 연도/월 선택 */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">연도</label>
            <select
              value={selYear}
              onChange={(e) => { setSelYear(Number(e.target.value)); setResult(null); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">월</label>
            <select
              value={selMonth}
              onChange={(e) => { setSelMonth(Number(e.target.value)); setResult(null); }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">집계 기간</p>
            <p className="text-sm font-medium text-blue-700">
              {selYear}년 {selMonth}월 전체 (해당 월의 업무일지 기준)
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={handleGenerate}>
            월간보고 생성
          </Button>
        </div>
      </Card>

      {/* 결과 */}
      {result && (
        result.rows.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <p className="text-gray-400 text-sm">해당 월에 업무 기록이 없습니다.</p>
              <p className="text-gray-400 text-xs mt-1">
                {result.year}년 {result.month}월의 업무일지를 먼저 작성해주세요.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {result.year}년 {result.month}월 월간보고
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  프로젝트 {result.rows.length}개 · 이번 달 실제 진행 내용 기준 · 차월 예정업무 제외
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleCopy('plain')}>
                  {plainCopied ? '복사됨 ✓' : '일반 복사'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleCopy('tsv')}>
                  {tsvCopied ? '복사됨 ✓' : 'TSV 복사 (엑셀용)'}
                </Button>
              </div>
            </div>
            <ReportTable rows={result.rows} />
            <TextPreviewSection
              plainText={toMonthlyPlainText(result)}
              tsvText={toMonthlyTsvText(result)}
            />
          </>
        )
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────

export default function WeeklyReport() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ReportTab>('week');

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/daily-work')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← 업무 기록 목록
        </button>
        <h1 className="text-2xl font-bold text-gray-900">보고서 생성</h1>
        <p className="text-gray-500 text-sm mt-1">
          업무일지 기록을 기반으로 주간 또는 월간 보고 내용을 자동으로 정리합니다.
        </p>
      </div>

      {/* 탭 스트립 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('week')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'week'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          주간보고
        </button>
        <button
          onClick={() => setActiveTab('month')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'month'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          월간보고
        </button>
      </div>

      {/* 탭 패널 */}
      {activeTab === 'week' ? <WeeklyPanel /> : <MonthlyPanel />}
    </div>
  );
}
