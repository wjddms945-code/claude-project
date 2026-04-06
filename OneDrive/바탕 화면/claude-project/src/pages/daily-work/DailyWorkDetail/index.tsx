import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDailyWorkStore } from '../../../store/dailyWorkStore';
import { useProjectStore } from '../../../store/projectStore';
import { dailyWorkService } from '../../../services/dailyWorkService';
import { WorkCategory } from '../../../types';
import { Badge, getDailyWorkStatusVariant } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Toast, useToast } from '../../../components/common/Toast';
import { formatDateFromYMD, formatDuration, getDailyWorkStatus, getWorkMinutesByDate } from '../../../utils/timeUtils';

const CATEGORIES: WorkCategory[] = ['회의', '기획', '메일공유', '리서치', '문서작업', '엑셀시트정리', '업무협조', '모니터링', '기타'];

interface LocalItem { id: string; category: WorkCategory; workText: string; inputHour: number; inputMinute: number; }
interface LocalProject { id: string; projectName: string; items: LocalItem[]; }

function generateLocalId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function makeEmptyItem(): LocalItem { return { id: generateLocalId(), category: '기획', workText: '', inputHour: 0, inputMinute: 0 }; }
function makeEmptyProject(): LocalProject { return { id: generateLocalId(), projectName: '', items: [makeEmptyItem()] }; }

export default function DailyWorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getLogById, getProjectsByLogId, getItemsByProjectId, updateLog } = useDailyWorkStore();
  const projectNames = useProjectStore((s) => s.projects.map((p) => p.name));

  const [newProjects, setNewProjects] = useState<LocalProject[]>([]);
  const [newItemsByProject, setNewItemsByProject] = useState<Record<string, LocalItem[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toasts, show: showToast, dismiss: dismissToast } = useToast();

  const log = getLogById(id ?? '');

  const handleDelete = async () => {
    if (!log) return;
    setIsDeleting(true);
    try {
      await dailyWorkService.deleteDailyWork(log.id);
      navigate('/daily-work');
    } finally {
      setIsDeleting(false);
    }
  };

  const addNewProject = () => setNewProjects((prev) => [...prev, makeEmptyProject()]);
  const removeNewProject = (projId: string) => setNewProjects((prev) => prev.filter((p) => p.id !== projId));
  const updateNewProjectName = (projId: string, name: string) => setNewProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, projectName: name } : p)));
  const addNewItem = (projId: string) => setNewProjects((prev) => prev.map((p) => p.id === projId ? { ...p, items: [...p.items, makeEmptyItem()] } : p));
  const removeNewItem = (projId: string, itemId: string) => setNewProjects((prev) => prev.map((p) => p.id === projId ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p));
  const updateNewItem = (projId: string, itemId: string, field: keyof LocalItem, value: string | number) => {
    setNewProjects((prev) => prev.map((p) => {
      if (p.id !== projId) return p;
      return { ...p, items: p.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item) };
    }));
    if (field === 'workText') {
      setValidationErrors((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  };

  const addNewItemToProject = (projId: string) => {
    setNewItemsByProject((prev) => ({
      ...prev,
      [projId]: [...(prev[projId] || []), makeEmptyItem()],
    }));
  };
  const removeNewItemFromProject = (projId: string, itemId: string) => {
    setNewItemsByProject((prev) => ({
      ...prev,
      [projId]: (prev[projId] || []).filter((i) => i.id !== itemId),
    }));
  };
  const updateNewItemInProject = (projId: string, itemId: string, field: keyof LocalItem, value: string | number) => {
    setNewItemsByProject((prev) => ({
      ...prev,
      [projId]: (prev[projId] || []).map((i) => (i.id === itemId ? { ...i, [field]: value } : i)),
    }));
    if (field === 'workText') {
      setValidationErrors((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  };

  const handleSaveProjectItems = async (projId: string) => {
    if (!log) return;
    const addedItems = newItemsByProject[projId] || [];
    if (addedItems.length === 0) return;

    const errors = new Set(validationErrors);
    let hasError = false;
    addedItems.forEach(item => {
      if (!item.workText.trim()) { errors.add(item.id); hasError = true; }
    });
    if (hasError) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const existingProjects = getProjectsByLogId(log.id);
      const existingPayload = existingProjects.map(proj => {
        const items = getItemsByProjectId(proj.id);
        const projectAdded = proj.id === projId ? addedItems : [];
        return {
          projectName: proj.projectName,
          items: [
            ...items.map(i => ({
              category: i.category,
              workText: i.workText,
              inputHour: i.inputHour,
              inputMinute: i.inputMinute,
            })),
            ...projectAdded
              .filter(i => i.workText.trim())
              .map(i => ({
                category: i.category,
                workText: i.workText.trim(),
                inputHour: i.inputHour,
                inputMinute: i.inputMinute,
              }))
          ]
        };
      });

      await dailyWorkService.saveDailyWork({
        workDate: log.workDate,
        workStatus: log.workStatus,
        projects: existingPayload,
      });

      setNewItemsByProject(prev => {
        const next = { ...prev };
        delete next[projId];
        return next;
      });
      showToast('저장되었습니다.', 'success');
    } catch {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewProjects = async () => {
    const hasNewProjects = newProjects.length > 0;
    const hasNewItems = Object.values(newItemsByProject).some(items => items.length > 0);

    if ((!hasNewProjects && !hasNewItems) || !log) return;

    // validate
    const errors = new Set<string>();
    newProjects.forEach(proj => {
      proj.items.forEach(item => {
        if (!item.workText.trim()) errors.add(item.id);
      });
    });
    Object.values(newItemsByProject).forEach(items => {
      items.forEach(item => {
        if (!item.workText.trim()) errors.add(item.id);
      });
    });

    if (errors.size > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const existingProjects = getProjectsByLogId(log.id);
      const existingPayload = existingProjects.map(proj => {
        const items = getItemsByProjectId(proj.id);
        const addedItems = newItemsByProject[proj.id] || [];

        return {
          projectName: proj.projectName,
          items: [
            ...items.map(i => ({
              category: i.category,
              workText: i.workText,
              inputHour: i.inputHour,
              inputMinute: i.inputMinute,
            })),
            ...addedItems
              .filter(i => i.workText.trim())
              .map(i => ({
                category: i.category,
                workText: i.workText.trim(),
                inputHour: i.inputHour,
                inputMinute: i.inputMinute,
              }))
          ]
        };
      });

      const addedPayload = newProjects
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
        }));

      await dailyWorkService.saveDailyWork({
        workDate: log.workDate,
        workStatus: log.workStatus,
        projects: [...existingPayload, ...addedPayload],
      });

      setNewProjects([]);
      setNewItemsByProject({});
      showToast('저장되었습니다.', 'success');
    } catch {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!log) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={() => navigate('/daily-work')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← 뒤로
        </button>
        <p className="text-gray-500">업무 기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const projects = getProjectsByLogId(log.id);
  const totalMinutes = log.totalMinutes;
  const TOTAL_WORK_MINUTES = getWorkMinutesByDate(log.workDate); // 금요일 240분, 그 외 480분
  const statusLabel = getDailyWorkStatus(totalMinutes, log.workStatus, log.workDate);
  const displayRemainingMinutes = Math.max(0, TOTAL_WORK_MINUTES - totalMinutes);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">업무 일지 삭제</h2>
            <p className="text-sm text-gray-500 mb-6">
              {formatDateFromYMD(log.workDate)}의 업무 일지와 모든 프로젝트/항목이 <span className="text-red-600 font-semibold">영구 삭제</span>됩니다. 계속하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                취소
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
                삭제 확인
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Back */}
      <button
        onClick={() => navigate('/daily-work')}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-6"
      >
        ← 업무 기록 목록
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {formatDateFromYMD(log.workDate)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {log.workStatus === '연차' ? (
              <Badge label="연차" variant="gray" />
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
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            삭제하기
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/daily-work/new?date=${log.workDate}`)}
          >
            수정하기
          </Button>
        </div>
      </div>

      {/* 연차일 경우 요약 및 프로젝트 목록 숨김 처리 */}
      {log.workStatus === '연차' ? (
        <Card className="p-12 text-center text-gray-500 border-dashed">
          <p className="mb-2 text-lg">연차 상태입니다.</p>
          <p className="text-sm">해당 일자의 업무 기록은 반영되지 않습니다.</p>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <Card className="mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">총 기록시간</p>
                <p className="font-semibold text-gray-900 text-lg">{formatDuration(totalMinutes)}</p>
                <p className="text-xs text-gray-500">{totalMinutes}분</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">미기록</p>
                <p className={`font-semibold text-lg ${displayRemainingMinutes > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                  {formatDuration(displayRemainingMinutes)}
                </p>
                <p className="text-xs text-gray-500">{displayRemainingMinutes}분</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">달성률</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {Math.min(100, Math.round((totalMinutes / TOTAL_WORK_MINUTES) * 100))}%
                </p>
                <p className="text-xs text-gray-500">기준 {TOTAL_WORK_MINUTES}분</p>
              </div>
            </div>
          </Card>

          {/* Projects & Items */}
          <div className="space-y-4 mb-6">
            {projects.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-400 text-sm">업무 항목이 없습니다.</p>
              </Card>
            ) : (
              projects.map((proj) => {
                const items = getItemsByProjectId(proj.id);
                const projTotal = items.reduce((sum, i) => sum + i.durationMinutes, 0);
                const projectLmsText = `[${proj.projectName}]\n${items.map(item => {
                  const hasCat = item.category && (item.category as string).trim() !== '' && (item.category as string) !== '-';
                  const prefix = hasCat ? `[${item.category}] ` : '';
                  return `${prefix}${item.workText} (${item.durationMinutes}분)`;
                }).join('\n')}`;

                return (
                  <Card key={proj.id}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-semibold text-gray-900">{proj.projectName}</h2>
                      <span className="text-sm text-gray-500 whitespace-nowrap shrink-0">{formatDuration(projTotal)}</span>
                    </div>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4 w-32 whitespace-nowrap">카테고리</th>
                            <th className="text-left text-xs text-gray-400 font-medium pb-2 pr-4 w-full">업무 내용</th>
                            <th className="text-right text-xs text-gray-400 font-medium pb-2 whitespace-nowrap">시간</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-3 pr-4 align-top pt-4 whitespace-nowrap w-32">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full inline-block mt-0.5">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3 pr-4 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words w-full">
                                {item.workText}
                              </td>
                              <td className="py-3 text-right text-gray-600 whitespace-nowrap align-top pt-4">
                                {formatDuration(item.durationMinutes)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200">
                            <td colSpan={2} className="pt-2 text-xs text-gray-400">소계</td>
                            <td className="pt-2 text-right text-sm font-semibold text-gray-900 whitespace-nowrap shrink-0">
                              {formatDuration(projTotal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* 추가된 새 업무(기존 프로젝트 내) 렌더링 */}
                    {(() => {
                      const itemsToRender = newItemsByProject[proj.id] || [];
                      if (itemsToRender.length === 0) return null;
                      return (
                        <div className="space-y-3 mt-4 mb-4 border-t border-gray-100 pt-4">
                          <h4 className="text-[13px] font-semibold text-blue-800 mb-2">추가할 업무</h4>
                          {itemsToRender.map((item) => {
                            const duration = item.inputHour * 60 + item.inputMinute;
                            const hasError = validationErrors.has(item.id);
                            return (
                              <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <select
                                    value={item.category}
                                    onChange={(e) => updateNewItemInProject(proj.id, item.id, 'category', e.target.value as WorkCategory)}
                                    className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                                  >
                                    {CATEGORIES.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                                    <input
                                      type="number" min={0} max={23}
                                      value={item.inputHour}
                                      onChange={(e) => updateNewItemInProject(proj.id, item.id, 'inputHour', Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                    <span className="text-xs text-gray-500">시</span>
                                    <input
                                      type="number" min={0} max={59}
                                      value={item.inputMinute}
                                      onChange={(e) => updateNewItemInProject(proj.id, item.id, 'inputMinute', Math.max(0, parseInt(e.target.value) || 0))}
                                      className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    />
                                    <span className="text-xs text-gray-500">분</span>
                                    <span className="text-xs text-gray-400 w-16 whitespace-nowrap text-right shrink-0">→ {duration}분</span>
                                  </div>
                                  <button
                                    onClick={() => removeNewItemFromProject(proj.id, item.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded shrink-0 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <textarea
                                  value={item.workText}
                                  onChange={(e) => updateNewItemInProject(proj.id, item.id, 'workText', e.target.value)}
                                  placeholder="추가할 업무 내용을 입력하세요."
                                  rows={2}
                                  className={`w-full min-h-[60px] border rounded-md px-3 py-2 text-[14px] leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    <div className="mb-6 flex items-center justify-between">
                      <button
                        onClick={() => addNewItemToProject(proj.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        + 업무추가
                      </button>
                      {newItemsByProject[proj.id]?.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setNewItemsByProject(prev => {
                                const next = { ...prev };
                                delete next[proj.id];
                                return next;
                              });
                            }}
                          >
                            취소
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSaveProjectItems(proj.id)}
                            loading={isSaving}
                          >
                            저장 (기존 목록에 추가)
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[13px] font-semibold text-gray-600">이 프로젝트 LMS 복사용 텍스트</h3>
                        <Button variant="secondary" size="sm" onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(projectLmsText);
                            // 개별 복사도 전체 복사와 동일하게 LMS 완료 상태로 저장
                            updateLog(log.id, { isLmsCopied: true });
                            showToast('프로젝트 LMS 텍스트가 복사되었습니다.', 'success');
                          } catch {
                            showToast('복사에 실패했습니다.', 'error');
                          }
                        }}>
                          개별 복사
                        </Button>
                      </div>
                      <pre className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap font-mono">
                        {projectLmsText}
                      </pre>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* 신규 프로젝트 추가 폼 */}
          {newProjects.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-blue-800">새 프로젝트 추가</h2>
              </div>
              {newProjects.map((proj) => (
                <Card key={proj.id} className="p-4 border-blue-200 shadow-sm">
                  {/* Project header */}
                  <div className="flex items-center gap-2 mb-4">
                    <select
                      value={proj.projectName}
                      onChange={(e) => updateNewProjectName(proj.id, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">-- 프로젝트 선택 --</option>
                      {projectNames.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      {proj.projectName && !projectNames.includes(proj.projectName) && (
                        <option value={proj.projectName}>{proj.projectName}</option>
                      )}
                    </select>
                    <button
                      onClick={() => removeNewProject(proj.id)}
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
                        <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={item.category}
                              onChange={(e) => updateNewItem(proj.id, item.id, 'category', e.target.value as WorkCategory)}
                              className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
                            >
                              {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <input
                                type="number" min={0} max={23}
                                value={item.inputHour}
                                onChange={(e) => updateNewItem(proj.id, item.id, 'inputHour', Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              <span className="text-xs text-gray-500">시</span>
                              <input
                                type="number" min={0} max={59}
                                value={item.inputMinute}
                                onChange={(e) => updateNewItem(proj.id, item.id, 'inputMinute', Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-12 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              <span className="text-xs text-gray-500">분</span>
                              <span className="text-xs text-gray-400 w-16 whitespace-nowrap text-right shrink-0">→ {duration}분</span>
                            </div>
                            <button
                              onClick={() => removeNewItem(proj.id, item.id)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded shrink-0 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <textarea
                            value={item.workText}
                            onChange={(e) => updateNewItem(proj.id, item.id, 'workText', e.target.value)}
                            placeholder="업무 내용을 입력하세요. 줄바꿈(Enter)으로 항목을 구분할 수 있습니다."
                            rows={4}
                            className={`w-full min-h-[100px] border rounded-md px-4 py-3 text-base leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => addNewItem(proj.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    + 업무 추가
                  </button>
                </Card>
              ))}
            </div>
          )}

          {/* 저장 또는 추가 버튼 영역 */}
          {(newProjects.length > 0 || Object.values(newItemsByProject).some(items => items.length > 0)) && (
            <div className="flex justify-end gap-2 mt-4 mb-6">
              <Button variant="secondary" onClick={() => { setNewProjects([]); setNewItemsByProject({}); }}>
                추가 취소
              </Button>
              <Button variant="primary" onClick={handleSaveNewProjects} loading={isSaving}>
                저장하기
              </Button>
            </div>
          )}

          {newProjects.length === 0 && (
            <button
              onClick={addNewProject}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-500 hover:text-blue-600 rounded-lg py-3 text-sm font-medium transition-colors mb-6"
            >
              + 프로젝트 추가
            </button>
          )}
        </>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
