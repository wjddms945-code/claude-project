import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyWorkStore } from '../../../store/dailyWorkStore';
import { Badge, getDailyWorkStatusVariant } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatDateFromYMD, formatDuration, getDailyWorkStatus, getWorkMinutesByDate } from '../../../utils/timeUtils';
import { Toast, useToast } from '../../../components/common/Toast';

export default function DailyWorkHistory() {
  const navigate = useNavigate();
  const { logs, projects, updateLog } = useDailyWorkStore();
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  // 날짜 필터 — workDate(YYYY-MM-DD) 기준
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  const sorted = [...logs].sort((a, b) => b.workDate.localeCompare(a.workDate));

  // 연도 목록 (데이터에서 추출)
  const availableYears = Array.from(
    new Set(logs.map((l) => l.workDate.slice(0, 4)))
  ).sort().reverse();

  const filtered = sorted.filter((log) => {
    if (filterYear && !log.workDate.startsWith(filterYear)) return false;
    if (filterMonth) {
      const ym = `${filterYear || log.workDate.slice(0, 4)}-${filterMonth}`;
      if (!log.workDate.startsWith(ym)) return false;
    }
    return true;
  });

  const hasFilter = filterYear || filterMonth;
  const resetFilter = () => { setFilterYear(''); setFilterMonth(''); };

  const getProjectCount = (logId: string) =>
    projects.filter((p) => p.dailyWorkLogId === logId).length;

  const handleCopyLms = async (logId: string, lmsText: string) => {
    try {
      await navigator.clipboard.writeText(lmsText);
      // LMS 복사 실행 시 해당 로그에 플래그 저장
      updateLog(logId, { isLmsCopied: true });
      showToast('LMS 텍스트가 복사되었습니다.', 'success');
    } catch {
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">업무 기록</h1>
          <p className="text-gray-500 text-sm mt-0.5">총 {logs.length}일의 기록</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/daily-work/weekly-report')}
          >
            보고서 생성
          </Button>
          <Button variant="primary" onClick={() => navigate('/daily-work/new')}>
            + 오늘 업무 작성
          </Button>
        </div>
      </div>

      {/* 날짜 필터 */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setFilterMonth(''); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 연도</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}년</option>
          ))}
        </select>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
            <option key={m} value={m}>{parseInt(m)}월</option>
          ))}
        </select>
        {hasFilter && (
          <>
            <button
              onClick={resetFilter}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              초기화
            </button>
            <span className="text-xs text-gray-400">{filtered.length}건</span>
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="업무 기록이 없습니다"
          description="오늘의 업무를 기록해보세요."
          action={{ label: '업무 작성하기', onClick: () => navigate('/daily-work/new') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const projCount = getProjectCount(log.id);
            const statusLabel = getDailyWorkStatus(log.totalMinutes, log.workStatus, log.workDate);
            const displayRemainingMinutes = Math.max(0, getWorkMinutesByDate(log.workDate) - log.totalMinutes);
            return (
              <Card key={log.id} className={`p-4 ${log.workStatus === '연차' ? 'bg-gray-50/50 opacity-75' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-sm ${log.workStatus === '연차' ? 'text-gray-500' : 'text-gray-900'}`}>
                        {formatDateFromYMD(log.workDate)}
                      </h3>
                      {log.workStatus === '연차' ? (
                        <Badge label="연차" variant="gray" />
                      ) : (
                        <>
                          <Badge label={statusLabel} variant={getDailyWorkStatusVariant(statusLabel)} />
                          <Badge
                            label={log.workStatus}
                            variant={log.workStatus === '근무' ? 'blue' : 'orange'}
                          />
                        </>
                      )}
                    </div>
                    {log.workStatus !== '연차' && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>총 {formatDuration(log.totalMinutes)}</span>
                        {displayRemainingMinutes > 0 && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-orange-500">미기록 {formatDuration(displayRemainingMinutes)}</span>
                          </>
                        )}
                        <span className="text-gray-300">·</span>
                        <span>프로젝트 {projCount}개</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.lmsExportText && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLms(log.id, log.lmsExportText);
                        }}
                      >
                        LMS 복사
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/daily-work/${log.id}`)}
                    >
                      상세보기
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
