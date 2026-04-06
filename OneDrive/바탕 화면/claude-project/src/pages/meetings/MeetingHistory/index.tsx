import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../../store/meetingStore';
import {
  Badge,
  getMeetingStatusVariant,
  getMeetingTypeVariant,
} from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatDate, formatTime, formatDuration } from '../../../utils/timeUtils';
import { MeetingType, MeetingStatus } from '../../../types';

const ALL_TYPES: MeetingType[] = ['내부회의', '개발회의', '디자인리뷰', '보고회의', '외부미팅'];
const ALL_STATUSES: MeetingStatus[] = ['진행중', '분석중', '완료', '오류'];

export default function MeetingHistory() {
  const navigate = useNavigate();
  const { meetings, results } = useMeetingStore();

  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState<MeetingType | ''>('');
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | ''>('');
  const [filterYM, setFilterYM] = useState(''); // "YYYY-MM" 형식

  const projectNames = Array.from(new Set(meetings.map((m) => m.projectName).filter(Boolean)));

  // 회의 데이터에서 연-월 목록 추출
  const availableYMs = Array.from(
    new Set(meetings.map((m) => m.startedAt.slice(0, 7)))
  ).sort().reverse();

  const filtered = [...meetings]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .filter((m) => {
      if (search) {
        const q = search.toLowerCase();
        if (!m.title.toLowerCase().includes(q) && !m.projectName.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (filterProject && m.projectName !== filterProject) return false;
      if (filterType && m.meetingType !== filterType) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterYM && !m.startedAt.startsWith(filterYM)) return false;
      return true;
    });

  const getResult = (meetingId: string) => results.find((r) => r.meetingId === meetingId);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회의 기록</h1>
          <p className="text-gray-500 text-sm mt-0.5">총 {meetings.length}개의 회의</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/meetings/new')}>
          + 새 회의
        </Button>
      </div>

      {/* Filters — 1행: 검색 + 프로젝트 + 유형 + 상태 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <input
          type="text"
          placeholder="회의명 또는 프로젝트 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-1 sm:col-span-2 lg:col-span-1"
        />
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 프로젝트</option>
          {projectNames.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MeetingType | '')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 유형</option>
          {ALL_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as MeetingStatus | '')}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Filters — 2행: 월 기준 필터 */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={filterYM}
          onChange={(e) => setFilterYM(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">전체 기간</option>
          {availableYMs.map((ym) => {
            const [y, mo] = ym.split('-');
            return (
              <option key={ym} value={ym}>
                {y}년 {parseInt(mo)}월
              </option>
            );
          })}
        </select>
        {(search || filterProject || filterType || filterStatus || filterYM) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{filtered.length}건</span>
            <button
              onClick={() => {
                setSearch('');
                setFilterProject('');
                setFilterType('');
                setFilterStatus('');
                setFilterYM('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              초기화
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="회의 기록이 없습니다"
          description="검색 조건을 변경하거나 새 회의를 시작해보세요."
          action={{ label: '새 회의 시작', onClick: () => navigate('/meetings/new') }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((meeting) => {
            const result = getResult(meeting.id);
            return (
              <Card
                key={meeting.id}
                hoverable
                className="p-4"
                onClick={() => navigate(`/meetings/${meeting.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{meeting.title}</h3>
                      <Badge label={meeting.status} variant={getMeetingStatusVariant(meeting.status)} />
                      <Badge label={meeting.meetingType} variant={getMeetingTypeVariant(meeting.meetingType)} />
                    </div>
                    {meeting.projectName && (
                      <p className="text-xs text-gray-500 mb-1">{meeting.projectName}</p>
                    )}
                    {result && (
                      <p className="text-sm text-gray-600 line-clamp-1">{result.summaryOneLine}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400 shrink-0">
                    <p className="font-medium text-gray-600">{formatDate(meeting.startedAt).split(' (')[0]}</p>
                    <p className="mt-0.5">{formatTime(meeting.startedAt)}</p>
                    {meeting.durationMinutes != null && (
                      <p className="mt-0.5">{formatDuration(meeting.durationMinutes)}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
