import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MeetingType } from '../../../types';
import { meetingService } from '../../../services/meetingService';
import { useMicrophone } from '../../../hooks/useMicrophone';
import { useProjectStore } from '../../../store/projectStore';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';

const MEETING_TYPES: MeetingType[] = [
  '내부회의',
  '개발회의',
  '디자인리뷰',
  '보고회의',
  '외부미팅',
];

export default function MeetingNew() {
  const navigate = useNavigate();
  const { requestPermission, error: micError } = useMicrophone();
  const projectNames = useProjectStore((s) => s.projects.map((p) => p.name));

  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('내부회의');
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setError(null);

    if (!title.trim()) {
      setError('회의명을 입력해주세요.');
      return;
    }

    setIsStarting(true);

    try {
      const granted = await requestPermission();
      if (!granted) {
        setIsStarting(false);
        return;
      }

      const meeting = await meetingService.createMeeting({
        title: title.trim(),
        projectName: projectName.trim(),
        meetingType,
      });

      navigate(`/meetings/${meeting.id}/live`);
    } catch {
      setError('회의를 시작하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsStarting(false);
    }
  };

  const displayError = micError || error;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3"
        >
          ← 뒤로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 회의 시작</h1>
        <p className="text-gray-500 text-sm mt-1">회의 정보를 입력하고 녹음을 시작하세요.</p>
      </div>

      <div className="max-w-lg">
        <Card>
          <div className="space-y-5">
            {/* 회의명 */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                회의명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 통합검색 UX 리뷰 회의"
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error && !title.trim() ? 'border-red-400' : 'border-gray-300'
                }`}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>

            {/* 프로젝트명 */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                프로젝트명
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">-- 프로젝트 선택 --</option>
                {projectNames.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                {/* 기존 저장된 프로젝트명이 목록에 없을 경우에도 표시 */}
                {projectName && !projectNames.includes(projectName) && (
                  <option value={projectName}>{projectName}</option>
                )}
              </select>
            </div>

            {/* 회의 유형 */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                회의 유형
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MEETING_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer text-sm transition-colors ${
                      meetingType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="meetingType"
                      value={type}
                      checked={meetingType === type}
                      onChange={() => setMeetingType(type)}
                      className="sr-only"
                    />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        meetingType === type
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {meetingType === type && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                {displayError}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-xs text-blue-600">
              회의 시작 시 마이크 접근 권한이 요청됩니다. 브라우저에서 허용을 눌러주세요.
            </div>

            {/* Submit */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleStart}
              loading={isStarting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              {isStarting ? '시작 중...' : '회의 시작'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
