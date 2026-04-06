import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeetingStore } from '../../../store/meetingStore';
import { meetingService } from '../../../services/meetingService';
import {
  Badge,
  getMeetingStatusVariant,
  getPriorityVariant,
  getCategoryVariant,
  getMeetingTypeVariant,
} from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { MeetingActionItem, Priority } from '../../../types';
import { formatDate, formatTime, formatDuration } from '../../../utils/timeUtils';

const PRIORITY_ORDER: Priority[] = ['최상위', '상위', '일반'];

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMeetingById, getResultByMeetingId, getActionItemsByMeetingId, updateActionItemStatus } =
    useMeetingStore();

  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const meeting = getMeetingById(id ?? '');
  const result = getResultByMeetingId(id ?? '');
  const actionItems = getActionItemsByMeetingId(id ?? '');

  const handleDeleteMeeting = async () => {
    if (!meeting) return;
    setIsDeleting(true);
    try {
      await meetingService.deleteMeeting(meeting.id);
      navigate('/meetings');
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-generate result when status is 분석중 and no result exists
  useEffect(() => {
    if (meeting?.status === '분석중' && !result) {
      setIsAnalyzing(true);
      const timer = setTimeout(async () => {
        try {
          await meetingService.generateResult(meeting.id);
        } finally {
          setIsAnalyzing(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [meeting?.id, meeting?.status, result]);

  if (!meeting) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-gray-500">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const groupedItems = PRIORITY_ORDER.reduce<Record<Priority, MeetingActionItem[]>>(
    (acc, priority) => {
      acc[priority] = actionItems.filter((item) => item.priorityDepth1 === priority);
      return acc;
    },
    { 최상위: [], 상위: [], 일반: [] }
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">회의 삭제</h2>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold text-gray-800">{meeting.title}</span> 회의 데이터와 관련 메모/결과/할일이 <span className="text-red-600 font-semibold">영구 삭제</span>됩니다. 계속하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                취소
              </Button>
              <Button variant="danger" onClick={handleDeleteMeeting} loading={isDeleting}>
                삭제 확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 회의 목록
        </button>
        <Button
          variant="secondary"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          삭제하기
        </Button>
      </div>

      {/* Analyzing state */}
      {(meeting.status === '분석중' || isAnalyzing) && !result && (
        <Card className="mb-6 text-center py-12">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">분석 중입니다...</h2>
          <p className="text-sm text-gray-500">
            회의 내용을 분석하여 결과를 생성하고 있습니다. 잠시만 기다려주세요.
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {/* 1. 기본 정보 */}
        <Card>
          <h1 className="text-xl font-bold text-gray-900 mb-3">{meeting.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {meeting.projectName && (
              <span className="text-sm text-gray-600 font-medium">{meeting.projectName}</span>
            )}
            <Badge label={meeting.meetingType} variant={getMeetingTypeVariant(meeting.meetingType)} />
            <Badge label={meeting.status} variant={getMeetingStatusVariant(meeting.status)} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">시작 시각</p>
              <p className="font-medium text-gray-800">{formatTime(meeting.startedAt)}</p>
              <p className="text-xs text-gray-500">{formatDate(meeting.startedAt)}</p>
            </div>
            {meeting.endedAt && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">종료 시각</p>
                <p className="font-medium text-gray-800">{formatTime(meeting.endedAt)}</p>
                <p className="text-xs text-gray-500">{formatDate(meeting.endedAt)}</p>
              </div>
            )}
            {meeting.durationMinutes != null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">총 시간</p>
                <p className="font-medium text-gray-800">{formatDuration(meeting.durationMinutes)}</p>
              </div>
            )}
          </div>
        </Card>

        {result && (
          <>
            {/* 2. 개요 */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">개요</h2>
              <p className="text-sm text-blue-700 font-medium bg-blue-50 rounded-md px-3 py-2 mb-4">
                {result.summaryOneLine}
              </p>
              <h3 className="text-sm font-medium text-gray-700 mb-2">회의 배경 및 목적</h3>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {result.overview}
              </p>
            </Card>

            {/* 3. 결론 */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">결론</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 text-green-700 rounded text-xs flex items-center justify-center font-bold">A</span>
                    주요 합의 사항
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-7">
                    {result.conclusionAgreements}
                  </p>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center font-bold">B</span>
                    다음 계획
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pl-7">
                    {result.conclusionNextSteps}
                  </p>
                </div>
              </div>
            </Card>

            {/* 4. 할 일 목록 */}
            {actionItems.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  할 일 목록
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({actionItems.filter((i) => i.status === '완료').length}/{actionItems.length} 완료)
                  </span>
                </h2>
                <div className="space-y-6">
                  {PRIORITY_ORDER.map((priority) => {
                    const items = groupedItems[priority];
                    if (items.length === 0) return null;
                    return (
                      <div key={priority}>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge label={priority} variant={getPriorityVariant(priority)} />
                          <span className="text-xs text-gray-400">({items.length}개)</span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                                item.status === '완료'
                                  ? 'bg-gray-50 border-gray-100 opacity-50'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <button
                                onClick={() =>
                                  updateActionItemStatus(
                                    item.id,
                                    item.status === '완료' ? '미실행' : '완료'
                                  )
                                }
                                className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  item.status === '완료'
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {item.status === '완료' && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" fill="none"
                                      strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <Badge label={item.categoryDepth2} variant={getCategoryVariant(item.categoryDepth2)} />
                                  <span
                                    className={`text-sm font-medium ${
                                      item.status === '완료' ? 'line-through text-gray-400' : 'text-gray-900'
                                    }`}
                                  >
                                    {item.taskDepth3}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-gray-500">{item.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* 5. 논의 포인트 */}
            {result.discussionPoints.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">논의 포인트</h2>
                <div className="space-y-4">
                  {result.discussionPoints.map((dp, idx) => (
                    <div key={dp.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-600 text-white rounded text-xs flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        {dp.topic}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{dp.content}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 6. 전체 전사 */}
            {result.transcriptText && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">전체 전사</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTranscriptOpen((v) => !v)}
                  >
                    {transcriptOpen ? '숨기기' : '전사 보기'}
                  </Button>
                </div>
                {transcriptOpen && (
                  <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-xs text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono leading-relaxed">
                    {result.transcriptText}
                  </pre>
                )}
                {!transcriptOpen && (
                  <p className="text-sm text-gray-400">전사 텍스트를 보려면 위 버튼을 클릭하세요.</p>
                )}
              </Card>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {meeting.status === '진행중' && (
        <div className="mt-6 flex justify-end">
          <Button variant="danger" onClick={() => navigate(`/meetings/${meeting.id}/live`)}>
            회의 재참가
          </Button>
        </div>
      )}

      {meeting.status === '분석중' && !result && !isAnalyzing && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            loading={isAnalyzing}
            onClick={async () => {
              setIsAnalyzing(true);
              try {
                await meetingService.generateResult(meeting.id);
              } finally {
                setIsAnalyzing(false);
              }
            }}
          >
            결과 생성하기
          </Button>
        </div>
      )}
    </div>
  );
}
