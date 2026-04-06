import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import { useDailyWorkStore } from '../../store/dailyWorkStore';
import { useProjectStore } from '../../store/projectStore';
import { Badge, getMeetingStatusVariant, getDailyWorkStatusVariant } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { WeeklyTimeline } from '../../components/home/WeeklyTimeline';
import { formatDate, formatDateFromYMD, formatDuration, getTodayString, getDailyWorkStatus, getWorkMinutesByDate } from '../../utils/timeUtils';

export default function Home() {
  const navigate = useNavigate();
  const { meetings, results } = useMeetingStore();
  const { logs, projects } = useDailyWorkStore();
  const { projects: allProjects } = useProjectStore();

  // 진행중 프로젝트만 필터링 (플로팅 위젯용)
  const activeProjects = allProjects.filter((p) => (p.status ?? 'active') === 'active');

  // 진행률 NaN 안전 계산
  const safeOverall = (proj: (typeof allProjects)[number]) => {
    const n = (v: number | undefined) => {
      const num = Number(v);
      return isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)));
    };
    return Math.round((n(proj.planPercent) + n(proj.designPercent) + n(proj.devPercent) + n(proj.qaPercent)) / 4);
  };

  const recentMeetings = [...meetings]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3);

  const recentLogs = [...logs]
    .sort((a, b) => b.workDate.localeCompare(a.workDate))
    .slice(0, 3);

  const getResult = (meetingId: string) =>
    results.find((r) => r.meetingId === meetingId);

  const getProjectCount = (logId: string) =>
    projects.filter((p) => p.dailyWorkLogId === logId).length;

  const todayStr = getTodayString();
  const todayLog = logs.find((l) => l.workDate === todayStr);
  const todayMinutes = todayLog ? todayLog.totalMinutes : 0;
  const STANDARD_MINUTES = getWorkMinutesByDate(todayStr); // 금요일 240분, 그 외 480분
  const progressPercent = Math.min(100, Math.round((todayMinutes / STANDARD_MINUTES) * 100));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-8 mb-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-blue-300 text-xs font-medium tracking-wide uppercase mb-2">개인 업무 기록실</p>
          <h1 className="text-2xl font-bold mb-1">Jungeun Workroom</h1>
          <p className="text-blue-200 mb-6">회의 기록부터 일일업무 정리까지, 내 흐름대로 관리하세요.</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/meetings/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-blue-800 font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              새 회의 시작
            </button>
            <button
              onClick={() => navigate('/daily-work/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              오늘 업무 작성
            </button>
          </div>
        </div>

        {/* 오늘 업무 완료율 원형 그래픽 */}
        <div className="flex flex-col items-center shrink-0 md:pl-8 md:border-l border-blue-700/50 pt-6 md:pt-0">
          <div className="relative w-24 h-24 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-blue-900/50"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                strokeLinecap="round"
                className="text-white transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{progressPercent}%</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-100">오늘 업무 완료율</p>
          <p className="text-xs text-blue-300 mt-1">기준 {STANDARD_MINUTES / 60}시간</p>
        </div>
      </div>

      {/* 주간/월간 활동 타임라인 */}
      <WeeklyTimeline />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Meetings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 회의</h2>
            <button
              onClick={() => navigate('/meetings')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 보기 →
            </button>
          </div>

          {recentMeetings.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">아직 회의 기록이 없습니다.</p>
              <button
                onClick={() => navigate('/meetings/new')}
                className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                첫 회의 시작하기
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentMeetings.map((meeting) => {
                const result = getResult(meeting.id);
                return (
                  <Card
                    key={meeting.id}
                    hoverable
                    className="p-4"
                    onClick={() => navigate(`/meetings/${meeting.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{meeting.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{meeting.projectName}</p>
                        {result && (
                          <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">
                            {result.summaryOneLine}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge label={meeting.status} variant={getMeetingStatusVariant(meeting.status)} />
                        <p className="text-xs text-gray-400">{formatDate(meeting.startedAt).split(' (')[0]}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Daily Work */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 업무 기록</h2>
            <button
              onClick={() => navigate('/daily-work')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 보기 →
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">아직 업무 기록이 없습니다.</p>
              <button
                onClick={() => navigate('/daily-work/new')}
                className="mt-3 text-blue-600 text-sm font-medium hover:text-blue-700"
              >
                오늘 업무 작성하기
              </button>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const projCount = getProjectCount(log.id);
                const statusLabel = getDailyWorkStatus(log.totalMinutes, log.workStatus);
                const isVacation = log.workStatus === '연차';
                return (
                  <Card
                    key={log.id}
                    hoverable
                    className={`p-4 ${isVacation ? 'bg-gray-50/50 opacity-75' : ''}`}
                    onClick={() => navigate(`/daily-work/${log.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium text-sm ${isVacation ? 'text-gray-500' : 'text-gray-900'}`}>
                          {formatDateFromYMD(log.workDate)}
                        </p>
                        {!isVacation && (
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              총 {formatDuration(log.totalMinutes)}
                            </span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">
                              프로젝트 {projCount}개
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isVacation ? (
                          <Badge
                            label="연차"
                            variant="gray"
                          />
                        ) : (
                          <>
                            <Badge
                              label={statusLabel}
                              variant={getDailyWorkStatusVariant(statusLabel)}
                            />
                            <Badge
                              label={log.workStatus}
                              variant={log.workStatus === '근무' ? 'blue' : 'orange'}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── 진행중 프로젝트 플로팅 위젯 ──────────────────────────
          fixed 포지셔닝으로 레이아웃에 영향 없음.
          2xl(1536px) 이상에서만 표시 → 우측 여백 ~232px 확보돼 겹침 없음. */}
      <div className="fixed right-6 top-24 z-20 hidden 2xl:block w-48">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* 위젯 헤더 */}
          <div className="px-3.5 pt-3 pb-2.5 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              진행중 프로젝트
            </p>
          </div>

          {/* 프로젝트 항목 목록 */}
          {activeProjects.length === 0 ? (
            <p className="text-xs text-gray-400 text-center px-3.5 py-5">
              진행중인 프로젝트가 없습니다
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-160px)] overflow-y-auto">
              {activeProjects.map((proj) => {
                const overall = safeOverall(proj);
                return (
                  <button
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/60 transition-colors group"
                  >
                    <p className="text-xs font-medium text-gray-800 group-hover:text-blue-700
                                  leading-snug line-clamp-2 transition-colors">
                      {proj.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${overall}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 shrink-0 tabular-nums">
                        {overall}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 전체 프로젝트 이동 */}
          <div className="px-3.5 py-2 border-t border-gray-100">
            <button
              onClick={() => navigate('/projects')}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              전체 프로젝트 보기 →
            </button>
          </div>

        </div>
      </div>
      {/* ─────────────────────────────────────────────────────── */}

    </div>
  );
}
