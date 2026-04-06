// 프로젝트 관리 모달
// 업무일지 화면에서 "프로젝트 관리" 버튼 클릭 시 열린다.
// 추가 / 인라인 수정 / 삭제(확인 절차 포함) 지원.
// useProjectStore 와 연결되어 변경 즉시 드롭다운에 반영된다.

import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectManagerModal({ isOpen, onClose }: Props) {
  const { projects, addProject, updateProject, deleteProject } = useProjectStore();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addProject({ name: trimmed });
    setNewName('');
  };

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setConfirmDeleteId(null);
  };

  const handleEditSave = () => {
    if (editingId && editingName.trim()) {
      updateProject(editingId, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteRequest = (id: string) => {
    setConfirmDeleteId(id);
    setEditingId(null);
  };

  const handleDeleteConfirm = (id: string) => {
    deleteProject(id);
    setConfirmDeleteId(null);
  };

  return (
    /* 배경 오버레이 — 외부 클릭 시 모달 닫기 */
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">프로젝트 관리</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 프로젝트 목록 */}
        <div className="px-5 py-3 max-h-72 overflow-y-auto divide-y divide-gray-100">
          {projects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">등록된 프로젝트가 없습니다.</p>
          )}
          {projects.map((proj) => (
            <div key={proj.id} className="flex items-center gap-2 py-2.5">
              {editingId === proj.id ? (
                /* 인라인 수정 모드 */
                <>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                    className="flex-1 border border-blue-500 rounded-md px-3 py-1.5 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleEditSave}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
                  >
                    취소
                  </button>
                </>
              ) : confirmDeleteId === proj.id ? (
                /* 삭제 확인 모드 */
                <>
                  <span className="flex-1 text-sm text-red-600 font-medium">{proj.name}</span>
                  <span className="text-xs text-red-500 shrink-0">삭제할까요?</span>
                  <button
                    onClick={() => handleDeleteConfirm(proj.id)}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 font-medium px-2 py-1 rounded"
                  >
                    삭제
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1"
                  >
                    취소
                  </button>
                </>
              ) : (
                /* 기본 보기 */
                <>
                  <span className="flex-1 text-sm text-gray-800">{proj.name}</span>
                  {/* 수정 버튼 */}
                  <button
                    onClick={() => handleEditStart(proj.id, proj.name)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="수정"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDeleteRequest(proj.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                    title="삭제"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 새 프로젝트 추가 */}
        <div className="px-5 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">새 프로젝트 추가</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="프로젝트명 입력"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-md hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              추가
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
