import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useProjectStore,
  getProjectStatusLabel,
  getProjectStatusVariant,
  ProjectStatus,
} from '../../store/projectStore';
import { useDailyWorkStore } from '../../store/dailyWorkStore';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: '기획중' },
  { value: 'active', label: '진행중' },
  { value: 'paused', label: '보류' },
  { value: 'completed', label: '완료' },
];

function ProgressBar({ value, color = 'bg-blue-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`${color} h-1.5 rounded-full transition-all`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, addProject, deleteProject } = useProjectStore();
  const { projects: workProjects, logs: workLogs, items: workItems } = useDailyWorkStore();

  // "기타", "프로젝트 없음" 등 일반 카드로 렌더링하지 않을 특수 이름
  // → 이 이름의 프로젝트는 그리드에서 숨기고 "프로젝트 없음" 특수 카드로 흡수
  const SPECIAL_NAMES = new Set(['기타', '프로젝트 없음']);

  // 미분류 업무: 등록 목록에 없는 이름 OR 특수 이름으로 저장된 항목 모두 포함
  const registeredNames = new Set(projects.map((p) => p.name));
  const unclassifiedItems = workProjects
    .filter((wp) => !registeredNames.has(wp.projectName) || SPECIAL_NAMES.has(wp.projectName))
    .flatMap((wp) => {
      const log = workLogs.find((l) => l.id === wp.dailyWorkLogId);
      if (!log) return [];
      return workItems
        .filter((i) => i.dailyWorkProjectId === wp.id)
        .map((i) => ({ date: log.workDate, text: i.workText, itemId: i.id }));
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('planning');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 필터
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('');

  const filtered = projects.filter((p) =>
    filterStatus ? p.status === filterStatus : true
  );

  // 정렬: 진행중 → 기획중 → 보류 → 완료
  const statusOrder: ProjectStatus[] = ['active', 'planning', 'paused', 'completed'];
  const sorted = [...filtered].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );
  // 특수 이름("기타", "프로젝트 없음")은 일반 카드 그리드에서 제외
  const sortedRegular = sorted.filter((p) => !SPECIAL_NAMES.has(p.name));

  const handleAdd = () => {
    if (!newName.trim()) return;
    addProject({
      name: newName.trim(),
      status: newStatus,
      startDate: newStartDate || undefined,
      endDate: newEndDate || undefined,
      goal: newGoal.trim() || undefined,
    });
    setNewName('');
    setNewStatus('planning');
    setNewStartDate('');
    setNewEndDate('');
    setNewGoal('');
    setShowAddForm(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteProject(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
          <p className="text-gray-500 text-sm mt-0.5">총 {projects.length}개 프로젝트</p>
        </div>
        <Button variant="primary" onClick={() => { setShowAddForm(true); setConfirmDeleteId(null); }}>
          + 새 프로젝트
        </Button>
      </div>

      {/* 새 프로젝트 추가 폼 */}
      {showAddForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">새 프로젝트 추가</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">프로젝트명 *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="프로젝트명을 입력하세요"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-500 mb-1">상태</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">시작일</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">종료(예정)일</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">목표 (한 줄 요약)</label>
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="선택 입력"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => { setShowAddForm(false); setNewName(''); }}>
                취소
              </Button>
              <Button variant="primary" onClick={handleAdd} disabled={!newName.trim()}>
                추가
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilterStatus('')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            filterStatus === ''
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체 ({projects.length})
        </button>
        {STATUS_OPTIONS.map((s) => {
          const count = projects.filter((p) => p.status === s.value).length;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                filterStatus === s.value
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* 프로젝트 목록 */}
      {sortedRegular.length === 0 && unclassifiedItems.length === 0 && (
        <EmptyState
          title="프로젝트가 없습니다"
          description="새 프로젝트를 추가해 보세요."
          action={{ label: '+ 새 프로젝트', onClick: () => setShowAddForm(true) }}
        />
      )}
      {sortedRegular.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedRegular.map((proj) => {
            // NaN 안전 처리: 숫자가 아니거나 없으면 0으로
            const safe = (v: number | undefined) => {
              const n = Number(v);
              return isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
            };
            const plan    = safe(proj.planPercent);
            const design  = safe(proj.designPercent);
            const dev     = safe(proj.devPercent);
            const qa      = safe(proj.qaPercent);
            const overall = Math.round((plan + design + dev + qa) / 4);

            const statusLabel   = getProjectStatusLabel(proj.status ?? 'active');
            const statusVariant = getProjectStatusVariant(proj.status ?? 'active');

            const phases = [
              { label: '기획',    value: plan,   color: 'bg-violet-500' },
              { label: '디자인',  value: design, color: 'bg-pink-400'   },
              { label: '개발',    value: dev,    color: 'bg-blue-800'   },
              { label: 'QA',      value: qa,     color: 'bg-emerald-500'},
            ];

            return (
              <Card
                key={proj.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow group relative${
                  proj.status === 'active' ? ' ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setConfirmDeleteId(null);
                  navigate(`/projects/${proj.id}`);
                }}
              >
                {/* 삭제 확인 오버레이 */}
                {confirmDeleteId === proj.id && (
                  <div
                    className="absolute inset-0 z-10 bg-white/90 rounded-xl flex items-center justify-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-sm text-red-500 font-medium">삭제할까요?</span>
                    <button
                      onClick={(e) => handleDeleteClick(proj.id, e)}
                      className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600"
                    >
                      삭제
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-200"
                    >
                      취소
                    </button>
                  </div>
                )}

                {/* [1순위] 프로젝트명 + 상태 뱃지 */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-[17px] leading-snug truncate">
                      {proj.name}
                    </h3>
                    <span className="shrink-0">
                      <Badge label={statusLabel} variant={statusVariant} />
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(proj.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 text-xs px-1.5 py-0.5 shrink-0 ml-1"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>

                {/* [2순위] 기간 */}
                <p className="text-[11px] text-gray-400 mb-3 leading-none">
                  {proj.startDate || proj.endDate
                    ? `${proj.startDate ?? '—'} ~ ${proj.endDate ?? '—'}`
                    : '일정 미지정'}
                </p>

                {/* [3순위] 전체 진행률 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-500">전체 진행률</span>
                    <span className="text-sm font-bold text-gray-800">{overall}%</span>
                  </div>
                  <ProgressBar
                    value={overall}
                    color={proj.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}
                  />
                </div>

                {/* [4순위] 단계별 진행률 */}
                <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-gray-100">
                  {phases.map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="text-[10px] text-gray-400 mb-1">{label}</div>
                      <ProgressBar value={value} color={color} />
                      <div className="text-[10px] font-semibold text-gray-600 mt-1 text-right">
                        {value}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── 프로젝트 없음 카드 ─────────────────────────────────
          미분류 업무(등록 프로젝트에 매핑되지 않은 업무일지 항목)를
          모아서 보여주는 히스토리 전용 카드. 전체 탭에서만 표시.  */}
      {filterStatus === '' && unclassifiedItems.length > 0 && (
        <div
          className="mt-4 bg-white border border-dashed border-gray-300 rounded-lg p-4
                     cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
          onClick={() => navigate('/projects/__unclassified')}
        >
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-medium text-gray-900">프로젝트 없음</h3>
            <span className="text-[10px] text-gray-400 hover:text-gray-600">
              미분류 업무 전체 보기 →
            </span>
          </div>
          <div className="space-y-1.5">
            {unclassifiedItems.map((item) => (
              <div key={item.itemId} className="flex items-start gap-2.5">
                <span className="text-gray-300 text-xs mt-0.5 shrink-0">•</span>
                <span className="text-[11px] text-gray-400 shrink-0 tabular-nums w-24">
                  {item.date}
                </span>
                <span className="text-xs text-gray-600 leading-relaxed line-clamp-1">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
