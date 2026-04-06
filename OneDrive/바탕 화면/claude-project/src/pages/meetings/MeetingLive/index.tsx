import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMeetingStore } from '../../../store/meetingStore';
import { meetingService } from '../../../services/meetingService';
import { useMicrophone } from '../../../hooks/useMicrophone';
import { useTimer } from '../../../hooks/useTimer';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { formatTime } from '../../../utils/timeUtils';

export default function MeetingLive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getMeetingById, getNotesByMeetingId } = useMeetingStore();
  const meeting = getMeetingById(id ?? '');
  const notes = getNotesByMeetingId(id ?? '');

  const { status: micStatus, requestPermission, stopRecording, error: micError } = useMicrophone();
  const { formattedTime } = useTimer(
    meeting?.startedAt ?? null,
    meeting?.status === '진행중'
  );

  const [noteText, setNoteText] = useState('');
  const [isKeyPoint, setIsKeyPoint] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  // Auto-request mic on mount if not yet active
  useEffect(() => {
    if (micStatus === 'idle') {
      requestPermission();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!meeting) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-gray-500">회의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (meeting.status !== '진행중') {
    navigate(`/meetings/${id}`);
    return null;
  }

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    await meetingService.addNote({
      meetingId: meeting.id,
      noteText: text,
      isKeyPoint,
    });
    setNoteText('');
    setIsKeyPoint(false);
  };

  const handleEnd = async () => {
    setIsEnding(true);
    stopRecording();
    await meetingService.endMeeting(meeting.id);
    navigate(`/meetings/${meeting.id}`);
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="recording-dot" />
            <span className="text-red-600 text-sm font-medium">녹음중</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
          {meeting.projectName && (
            <p className="text-gray-500 text-sm mt-0.5">{meeting.projectName}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-gray-900">{formattedTime}</div>
          <p className="text-xs text-gray-400 mt-0.5">
            시작: {formatTime(meeting.startedAt)}
          </p>
        </div>
      </div>

      {/* Mic status warning */}
      {micStatus === 'denied' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">
          {micError ?? '마이크 권한이 거부되었습니다. 녹음 없이 메모만 가능합니다.'}
        </div>
      )}
      {micStatus === 'unsupported' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-sm text-yellow-700">
          이 브라우저는 마이크를 지원하지 않습니다. 메모 기능만 이용 가능합니다.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Note input */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">회의 메모</h2>
          <div className="space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="회의 내용을 입력하세요..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleAddNote();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setIsKeyPoint((v) => !v)}
                  className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-md border transition-colors ${
                    isKeyPoint
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span>⭐</span>
                  <span>중요 표시</span>
                </button>
              </label>
              <p className="text-xs text-gray-400">Ctrl+Enter로 추가</p>
            </div>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleAddNote}
              disabled={!noteText.trim()}
            >
              메모 추가
            </Button>
          </div>
        </Card>

        {/* Notes list */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            메모 목록 ({notes.length})
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {sortedNotes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                아직 메모가 없습니다.
              </p>
            ) : (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-md text-sm ${
                    note.isKeyPoint
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {note.isKeyPoint && <span className="shrink-0">⭐</span>}
                    <p className="text-gray-800 flex-1">{note.noteText}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(note.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* End meeting button */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="danger"
          size="lg"
          onClick={() => setShowConfirm(true)}
        >
          회의 종료
        </Button>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              회의를 종료하시겠습니까?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              회의를 종료하면 녹음이 중단되고 결과 분석이 시작됩니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={isEnding}
              >
                취소
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleEnd}
                loading={isEnding}
              >
                종료하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
