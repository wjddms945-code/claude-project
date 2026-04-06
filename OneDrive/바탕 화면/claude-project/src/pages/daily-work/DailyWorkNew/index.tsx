import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WorkCategory, WorkStatus } from '../../../types';
import { useProjectStore } from '../../../store/projectStore';
import { dailyWorkService } from '../../../services/dailyWorkService';
import { useDailyWorkStore } from '../../../store/dailyWorkStore';
import { generateLmsText } from '../../../utils/lmsGenerator';
import { formatDuration, getTodayString, getWorkMinutesByDate } from '../../../utils/timeUtils';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Toast, useToast } from '../../../components/common/Toast';

const CATEGORIES: WorkCategory[] = ['회의', '기획', '메일공유', '리서치', '문서작업', '엑셀시트정리', '업무협조', '모니터링', '기타'];
// 기준 근무시간은 날짜별로 계산 (getWorkMinutesByDate 사용)

interface LocalItem {
  id: string;
  category: WorkCategory;
  workText: string;
  inputHour: number;
  inputMinute: number;
}

interface LocalProject {
  id: string;
  projectName: string;
  items: LocalItem[];
}

function generateLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeEmptyItem(): LocalItem {
  return { id: generateLocalId(), category: '기획', workText: '', inputHour: 0, inputMinute: 0 };
}

function makeEmptyProject(): LocalProject {
  return { id: generateLocalId(), projectName: '', items: [makeEmptyItem()] };
}

export default function DailyWorkNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logs, projects: storeProjects, items: storeItems, updateLog } = useDailyWorkStore();
  // 공통 프로젝트 스토어: 추가/수정/삭제 가능
  const projectNames = useProjectStore((s) => s.projects.map((p) => p.name));

  const initialDate = searchParams.get('date') ?? getTodayString();
  const [workDate, setWorkDate] = useState(initialDate);
  const [workStatus, setWorkStatus] = useState<WorkStatus>('근무');
  const [localProjects, setLocalProjects] = useState<LocalProject[]>([makeEmptyProject()]);
  const [lmsPreview, setLmsPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  // 날짜 기준 기준 근무시간 (금요일 240분, 그 외 480분)
  const workMinutes = getWorkMinutesByDate(workDate);

  // Load existing log for the date
  useEffect(() => {
    const existingLog = logs.find((l) => l.workDate === workDate);
    if (existingLog) {
      setWorkStatus(existingLog.workStatus);
      const existingProjects = storeProjects
        .filter((p) => p.dailyWorkLogId === existingLog.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      if (existingProjects.length > 0) {
        const loaded: LocalProject[] = existingProjects.map((proj) => {
          const projItems = storeItems
            .filter((i) => i.dailyWorkProjectId === proj.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          return {
            id: generateLocalId(),
            projectName: proj.projectName,
            items: projItems.length > 0
              ? projItems.map((i) => ({
                  id: generateLocalId(),
                  category: i.category,
                  workText: i.workText,
                  inputHour: i.inputHour,
                  inputMinute: i.inputMinute,
                }))
              : [makeEmptyItem()],
          };
        });
        setLocalProjects(loaded);
      } else {
        setLocalProjects([makeEmptyProject()]);
      }
    } else {
      setLocalProjects([makeEmptyProject()]);
      setWorkStatus('근무');
    }
    setLmsPreview(null);
  }, [workDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMinutes = localProjects.reduce(
    (sum, proj) =>
      sum +
      proj.items.reduce((s, item) => s + item.inputHour * 60 + item.inputMinute, 0),
    0
  );
  const remainingMinutes = Math.max(0, workMinutes - totalMinutes);

  const addProject = () => {
    setLocalProjects((prev) => [...prev, makeEmptyProject()]);
  };

  const removeProject = (projId: string) => {
    setLocalProjects((prev) => prev.filter((p) => p.id !== projId));
  };

  const updateProjectName = (projId: string, name: string) => {
    setLocalProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, projectName: name } : p))
    );
  };

  const addItem = (projId: string) => {
    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projId ? { ...p, items: [...p.items, makeEmptyItem()] } : p
      )
    );
  };

  const removeItem = (projId: string, itemId: string) => {
    setLocalProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? { ...p, items: p.items.filter((i) => i.id !== itemId) }
          : p
      )
    );
  };

  const updateItem = (
    projId: string,
    itemId: string,
    field: keyof LocalItem,
    value: string | number
  ) => {
    setLocalProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          items: p.items.map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, [field]: value };
          }),
        };
      })
    );
    // Clear validation error for this item
    if (field === 'workText') {
      setValidationErrors((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const validate = useCallback(() => {
    if (workStatus === '연차') {
      setValidationErrors(new Set());
      setWarnings([]);
      return true;
    }

    const errors = new Set<string>();
    const newWarnings: string[] = [];

    localProjects.forEach((proj) => {
      proj.items.forEach((item) => {
        if (!item.workText.trim()) {
          errors.add(item.id);
        }
      });
    });

    if (totalMinutes > workMinutes) {
      newWarnings.push(`기록 시간이 기준 근무시간(${workMinutes}분)을 초과했습니다. (현재 ${totalMinutes}분)`);
    }

    if (workStatus !== '근무' && totalMinutes > 0) {
      newWarnings.push('근무 상태를 확인해주세요. 연차/반차로 설정되어 있으나 업무 항목이 있습니다.');
    }

    setValidationErrors(errors);
    setWarnings(newWarnings);
    return errors.size === 0;
  }, [localProjects, totalMinutes, workStatus, workMinutes]);

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await dailyWorkService.saveDailyWork({
        workDate,
        workStatus,
        projects: workStatus === '연차' ? [] : localProjects
          .filter((p) => p.projectName.trim() || p.items.some((i) => i.workText.trim()))
          .map((proj) => ({
            projectName: proj.projectName.trim() || '미지정 프로젝트',
            items: proj.items
              .filter((i) => i.workText.trim())
              .map((item) => ({
                category: item.category,
                workText: item.workText.trim(),
                inputHour: item.inputHour,
                inputMinute: item.inputMinute,
              })),
          })),
      });
      showToast('업무 기록이 저장되었습니다.', 'success');
    } catch {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateLms = () => {
    // Build temporary project/item structures for LMS generation
    const tempProjects = localProjects.map((p, idx) => ({
      id: p.id,
      dailyWorkLogId: 'temp',
      projectName: p.projectName || '미지정 프로젝트',
      sortOrder: idx + 1,
    }));
    const itemsByProject: Record<string, import('../../../types').DailyWorkItem[]> = {};
    localProjects.forEach((proj, projIdx) => {
      itemsByProject[proj.id] = proj.items
        .filter((i) => i.workText.trim())
        .map((item, itemIdx) => ({
          id: item.id,
          dailyWorkProjectId: proj.id,
          category: item.category,
          workText: item.workText.trim(),
          inputHour: item.inputHour,
          inputMinute: item.inputMinute,
          durationMinutes: item.inputHour * 60 + item.inputMinute,
          sortOrder: itemIdx + 1,
        }));
      void projIdx;
    });
    const lms = generateLmsText(tempProjects, itemsByProject);
    setLmsPreview(lms);
  };

  const handleCopyLms = async () => {
    if (!lmsPreview) return;
    const dateToMark = workDate; // await 이전에 동기적으로 캡처

    // 신규·기존 날짜 모두 대상: 해당 날짜 로그가 없는 경우에만 자동 저장
    const preCheck = useDailyWorkStore.getState().logs.find((l) => l.workDate === dateToMark);
    if (!preCheck && validate()) {
      try {
        await dailyWorkService.saveDailyWork({
          workDate,
          workStatus,
          projects: workStatus === '연차' ? [] : localProjects
            .filter((p) => p.projectName.trim() || p.items.some((i) => i.workText.trim()))
            .map((proj) => ({
              projectName: proj.projectName.trim() || '미지정 프로젝트',
              items: proj.items
                .filter((i) => i.workText.trim())
                .map((item) => ({
                  category: item.category,
                  workText: item.workText.trim(),
                  inputHour: item.inputHour,
                  inputMinute: item.inputMinute,
                })),
            })),
        });
      } catch {
        showToast('저장 후 복사를 시도했으나 저장에 실패했습니다.', 'error');
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(lmsPreview);
      // await 이후 클로저 stale 방지: 스토어에서 직접 최신 상태 조회
      const freshLog = useDailyWorkStore.getState().logs.find((l) => l.workDate === dateToMark);
      if (freshLog) {
        updateLog(freshLog.id, { isLmsCopied: true });
      }
      showToast('LMS 텍스트가 복사되었습니다.', 'success');
    } catch {
      showToast('복사에 실패했습니다.', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/daily-work')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← 업무 기록 목록
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">업무 기록 작성</h1>
        </div>
      </div>

      {/* Header section */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">날짜</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 shrink-0">근무 상태</label>
            <select
              value={workStatus}
              onChange={(e) => setWorkStatus(e.target.value as WorkStatus)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="근무">근무</option>
              <option value="반차">반차</option>
              <option value="연차">연차</option>
            </select>
          </div>
          {workStatus !== '연차' && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-sm">
                <span className="text-gray-500">총 기록시간: </span>
                <span className={`font-semibold ${totalMinutes > workMinutes ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDuration(totalMinutes)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">미기록: </span>
                <span className={`font-semibold ${remainingMinutes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatDuration(remainingMinutes)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
              {w}
            </div>
          ))}
        </div>
      )}

      {workStatus === '연차' ? (
        <Card className="p-8 text-center text-gray-500 mb-6 bg-gray-50 border-dashed">
          <p className="mb-2">연차 상태입니다.</p>
          <p className="text-sm">업무 내용 입력 없이 이대로 저장할 수 있습니다.</p>
        </Card>
      ) : (
        <>
          {/* Projects */}
          <div className="space-y-4 mb-4">
            {localProjects.map((proj) => (
          <Card key={proj.id} className="p-4">
            {/* Project header */}
            <div className="flex items-center gap-2 mb-4">
              <select
                value={proj.projectName}
                onChange={(e) => updateProjectName(proj.id, e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- 프로젝트 선택 --</option>
                {projectNames.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {/* 기존 저장된 프로젝트명이 현재 목록에 없을 경우에도 표시 */}
                {proj.projectName && !projectNames.includes(proj.projectName) && (
                  <option value={proj.projectName}>{proj.projectName}</option>
                )}
              </select>
              <button
                onClick={() => removeProject(proj.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="프로젝트 삭제"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-3">
              {proj.items.map((item) => {
                const duration = item.inputHour * 60 + item.inputMinute;
                const hasError = validationErrors.has(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    {/* 컨트롤 행: 카테고리 + 시간 + 삭제 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(proj.id, item.id, 'category', e.target.value as WorkCategory)}
                        className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={item.inputHour}
                          onChange={(e) =>
                            updateItem(proj.id, item.id, 'inputHour', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <span className="text-xs text-gray-500">시</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={item.inputMinute}
                          onChange={(e) =>
                            updateItem(proj.id, item.id, 'inputMinute', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        <span className="text-xs text-gray-500">분</span>
                        <span className="text-xs text-gray-400 w-16 whitespace-nowrap text-right shrink-0">
                          → {duration}분
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(proj.id, item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded shrink-0 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* 업무 내용 textarea */}
                    <textarea
                      value={item.workText}
                      onChange={(e) => updateItem(proj.id, item.id, 'workText', e.target.value)}
                      placeholder="업무 내용을 입력하세요. 줄바꿈(Enter)으로 항목을 구분할 수 있습니다."
                      rows={4}
                      className={`w-full min-h-[100px] border rounded-md px-4 py-3 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                        hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => addItem(proj.id)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              + 업무 추가
            </button>
          </Card>
        ))}
      </div>

      {/* Add project */}
      <button
        onClick={addProject}
        className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-500 hover:text-blue-600 rounded-lg py-3 text-sm font-medium transition-colors mb-6"
      >
        + 프로젝트 추가
      </button>
        </>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="primary" size="lg" onClick={handleSave} loading={isSaving}>
          저장하기
        </Button>
        {workStatus !== '연차' && (
          <Button variant="secondary" size="lg" onClick={handleGenerateLms}>
            LMS 텍스트 생성
          </Button>
        )}
      </div>

      {/* LMS Preview */}
      {lmsPreview !== null && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">LMS 미리보기</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLms}
            >
              복사
            </Button>
          </div>
          {lmsPreview ? (
            <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {lmsPreview}
            </pre>
          ) : (
            <p className="text-sm text-gray-400">업무 항목을 입력하면 LMS 텍스트가 생성됩니다.</p>
          )}
        </Card>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
