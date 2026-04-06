import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useProjectStore,
  getOverallPercent,
  getProjectStatusLabel,
  getProjectStatusVariant,
  ProjectStatus,
} from '../../store/projectStore';
import { useDailyWorkStore } from '../../store/dailyWorkStore';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { formatDateFromYMD, formatDuration } from '../../utils/timeUtils';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: '기획중' },
  { value: 'active', label: '진행중' },
  { value: 'paused', label: '보류' },
  { value: 'completed', label: '완료' },
];

function PercentInput({
  label,
  value,
  onChange,
  color = 'bg-blue-500',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            value={value}
            onChange={(e) => {
              const v = Math.min(100, Math.max(0, Number(e.target.value)));
              onChange(v);
            }}
            className="w-14 text-right border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <div
        className="relative w-full bg-gray-100 rounded-full h-2 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
          onChange(Math.min(100, Math.max(0, pct)));
        }}
      >
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, updateProject } = useProjectStore();
  const { logs, projects: workProjects, items: workItems } = useDailyWorkStore();

  const project = projects.find((p) => p.id === id);

  // 편집 상태
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editOverview, setEditOverview] = useState('');
  const [editEffect, setEditEffect] = useState('');
  const [editDesignOwner, setEditDesignOwner] = useState('');
  const [editDevOwner, setEditDevOwner] = useState('');
  const [editQaOwner, setEditQaOwner] = useState('');

  // 진행률 편집은 별도 즉시 반영 (저장 버튼 없이)
  const handlePercentChange = (field: 'planPercent' | 'designPercent' | 'devPercent' | 'qaPercent', val: number) => {
    if (!project) return;
    updateProject(project.id, { [field]: val });
  };

  // ── 미분류 업무 전체 보기 특수 케이스 ──────────────────────────
  if (id === '__unclassified') {
    // "기타", "프로젝트 없음" 이름으로 저장된 항목도 미분류로 흡수
    const SPECIAL_NAMES = new Set(['기타', '프로젝트 없음']);
    const registeredNames = new Set(projects.map((p) => p.name));
    const allUnclassified = workProjects
      .filter((wp) => !registeredNames.has(wp.projectName) || SPECIAL_NAMES.has(wp.projectName))
      .flatMap((wp) => {
        const log = logs.find((l) => l.id === wp.dailyWorkLogId);
        if (!log) return [];
        return workItems
          .filter((i) => i.dailyWorkProjectId === wp.id)
          .map((i) => ({
            date: log.workDate,
            text: i.workText,
            id: i.id,
            category: i.category,
            duration: i.durationMinutes,
          }));
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate('/projects')}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← 목록
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">프로젝트 없음</h1>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          프로젝트를 선택하지 않고 작성된 업무일지 히스토리입니다.
        </p>

        {allUnclassified.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-gray-400">
              프로젝트 없음으로 작성된 업무가 없습니다.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              업무 기록 작성 시 프로젝트를 선택하지 않으면 이곳에 나타납니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allUnclassified.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3"
              >
                <span className="text-xs text-gray-400 shrink-0 pt-0.5 tabular-nums w-24">
                  {item.date}
                </span>
                <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                  {item.category}
                </span>
                <p className="text-sm text-gray-700 flex-1 leading-relaxed">{item.text}</p>
                <span className="text-xs text-gray-400 shrink-0">
                  {formatDuration(item.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-gray-400 text-sm">프로젝트를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          ← 목록으로
        </button>
      </div>
    );
  }

  const overall = getOverallPercent(project);
  const statusLabel = getProjectStatusLabel(project.status);
  const statusVariant = getProjectStatusVariant(project.status);

  // 해당 프로젝트 이름과 연결된 업무 기록 수집
  const linkedWorkProjects = workProjects.filter(
    (wp) => wp.projectName === project.name
  );
  const workHistory = linkedWorkProjects
    .map((wp) => {
      const log = logs.find((l) => l.id === wp.dailyWorkLogId);
      const projItems = workItems.filter((i) => i.dailyWorkProjectId === wp.id);
      return { log, items: projItems, workProjectId: wp.id };
    })
    .filter((h): h is typeof h & { log: NonNullable<typeof h['log']> } => h.log !== undefined)
    .sort((a, b) => b.log.workDate.localeCompare(a.log.workDate));

  const totalWorkMinutes = workHistory.reduce(
    (sum, h) => sum + h.items.reduce((s, i) => s + i.durationMinutes, 0),
    0
  );

  const handleEditStart = () => {
    setEditName(project.name);
    setEditStatus(project.status);
    setEditStartDate(project.startDate ?? '');
    setEditEndDate(project.endDate ?? '');
    setEditGoal(project.goal ?? '');
    setEditOverview(project.overview ?? '');
    setEditEffect(project.expectedEffect ?? '');
    setEditDesignOwner(project.designOwner ?? '');
    setEditDevOwner(project.devOwner ?? '');
    setEditQaOwner(project.qaOwner ?? '');
    setEditing(true);
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateProject(project.id, {
      name: editName.trim(),
      status: editStatus,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
      goal: editGoal.trim() || undefined,
      overview: editOverview.trim() || undefined,
      expectedEffect: editEffect.trim() || undefined,
      designOwner: editDesignOwner.trim() || undefined,
      devOwner: editDevOwner.trim() || undefined,
      qaOwner: editQaOwner.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
        >
          ← 목록
        </button>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
        <Badge label={statusLabel} variant={statusVariant} />
        <div className="ml-auto flex items-center gap-2">
          {!editing && (
            <Button variant="secondary" size="sm" onClick={handleEditStart}>
              정보 수정
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 왼쪽: 프로젝트 정보 + 진행률 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 전체 진행률 카드 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">전체 진행률</span>
              <span className="text-2xl font-bold text-blue-600">{overall}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all ${
                  project.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${overall}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">기획·디자인·개발·QA 진행률의 평균</p>
          </Card>

          {/* 단계별 진행률 */}
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">단계별 진행률</h2>
            <PercentInput
              label="기획"
              value={project.planPercent}
              onChange={(v) => handlePercentChange('planPercent', v)}
              color="bg-violet-500"
            />
            <PercentInput
              label="디자인"
              value={project.designPercent}
              onChange={(v) => handlePercentChange('designPercent', v)}
              color="bg-pink-400"
            />
            <PercentInput
              label="개발"
              value={project.devPercent}
              onChange={(v) => handlePercentChange('devPercent', v)}
              color="bg-blue-500"
            />
            <PercentInput
              label="QA"
              value={project.qaPercent}
              onChange={(v) => handlePercentChange('qaPercent', v)}
              color="bg-green-500"
            />
          </Card>

          {/* 프로젝트 정보 */}
          <Card className="p-4">
            {editing ? (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">프로젝트 정보 수정</h2>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">프로젝트명 *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">상태</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">종료(예정)일</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">목표</label>
                  <input
                    type="text"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="한 줄 목표 요약"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">개요</label>
                  <textarea
                    value={editOverview}
                    onChange={(e) => setEditOverview(e.target.value)}
                    rows={2}
                    placeholder="프로젝트 개요"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">기대효과</label>
                  <textarea
                    value={editEffect}
                    onChange={(e) => setEditEffect(e.target.value)}
                    rows={2}
                    placeholder="기대효과"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                {/* 담당자 */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">담당자</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-14 shrink-0">디자인</span>
                      <input
                        type="text"
                        value={editDesignOwner}
                        onChange={(e) => setEditDesignOwner(e.target.value)}
                        placeholder="예: 김정은프로, 홍길동프로"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-14 shrink-0">개발</span>
                      <input
                        type="text"
                        value={editDevOwner}
                        onChange={(e) => setEditDevOwner(e.target.value)}
                        placeholder="예: 김정은프로, 홍길동프로"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-14 shrink-0">QA</span>
                      <input
                        type="text"
                        value={editQaOwner}
                        onChange={(e) => setEditQaOwner(e.target.value)}
                        placeholder="예: 김정은프로, 홍길동프로"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">여러 명일 경우 콤마(,)로 구분해 입력하세요</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="primary" onClick={handleEditSave} disabled={!editName.trim()}>
                    저장
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">프로젝트 정보</h2>
                {(project.startDate || project.endDate) && (
                  <div>
                    <p className="text-xs text-gray-400">일정</p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {project.startDate ?? '—'} ~ {project.endDate ?? '—'}
                    </p>
                  </div>
                )}
                {project.goal && (
                  <div>
                    <p className="text-xs text-gray-400">목표</p>
                    <p className="text-sm text-gray-700 mt-0.5">{project.goal}</p>
                  </div>
                )}
                {project.overview && (
                  <div>
                    <p className="text-xs text-gray-400">개요</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{project.overview}</p>
                  </div>
                )}
                {project.expectedEffect && (
                  <div>
                    <p className="text-xs text-gray-400">기대효과</p>
                    <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{project.expectedEffect}</p>
                  </div>
                )}
                {(project.designOwner || project.devOwner || project.qaOwner) && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">담당자</p>
                    <div className="space-y-1">
                      {project.designOwner && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 w-14 shrink-0 pt-px">디자인</span>
                          <span className="text-sm text-gray-700">{project.designOwner}</span>
                        </div>
                      )}
                      {project.devOwner && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 w-14 shrink-0 pt-px">개발</span>
                          <span className="text-sm text-gray-700">{project.devOwner}</span>
                        </div>
                      )}
                      {project.qaOwner && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-400 w-14 shrink-0 pt-px">QA</span>
                          <span className="text-sm text-gray-700">{project.qaOwner}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!project.startDate && !project.goal && !project.overview && !project.expectedEffect && (
                  <p className="text-sm text-gray-400">등록된 정보가 없습니다. 수정 버튼으로 내용을 추가해보세요.</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* 오른쪽: 업무 히스토리 */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">업무 히스토리</h2>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{workHistory.length}회 기록</span>
                {totalWorkMinutes > 0 && (
                  <span>총 {formatDuration(totalWorkMinutes)}</span>
                )}
              </div>
            </div>

            {workHistory.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-gray-400">연결된 업무 기록이 없습니다.</p>
                <p className="text-xs text-gray-300 mt-1">
                  업무 기록 작성 시 이 프로젝트를 선택하면 자동으로 연결됩니다.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* 타임라인 선 */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                <div className="space-y-4">
                  {workHistory.map(({ log, items: histItems }) => {
                    const logMinutes = histItems.reduce((s, i) => s + i.durationMinutes, 0);
                    return (
                      <div key={log.id} className="flex gap-4">
                        {/* 타임라인 점 — relative z-10으로 세로 선(absolute) 위에 표시 */}
                        <div className="relative z-10 shrink-0 mt-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        </div>
                        {/* 내용 */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <button
                              onClick={() => navigate(`/daily-work/${log.id}`)}
                              className="text-xs font-semibold text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                            >
                              {formatDateFromYMD(log.workDate)}
                            </button>
                            <span className="text-xs text-gray-400">{formatDuration(logMinutes)}</span>
                          </div>
                          <div className="space-y-1">
                            {histItems.map((item) => (
                              <div key={item.id} className="flex items-start gap-2">
                                <span className="text-[10px] text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                                  {item.category}
                                </span>
                                <p className="text-xs text-gray-600 leading-relaxed">{item.workText}</p>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-auto">
                                  {formatDuration(item.durationMinutes)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
