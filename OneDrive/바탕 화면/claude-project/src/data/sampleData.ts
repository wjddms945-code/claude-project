import {
  Meeting,
  MeetingNote,
  MeetingResult,
  MeetingActionItem,
  DailyWorkLog,
  DailyWorkProject,
  DailyWorkItem,
} from '../types';

// Helper: date offsets from 2026-03-27
const now = new Date('2026-03-27T10:00:00');
const yesterday = new Date('2026-03-26T00:00:00');
const twoDaysAgo = new Date('2026-03-25T00:00:00');

const meeting1StartedAt = new Date('2026-03-25T14:00:00').toISOString();
const meeting1EndedAt = new Date('2026-03-25T16:05:00').toISOString();
const meeting2StartedAt = new Date('2026-03-26T10:00:00').toISOString();
const meeting2EndedAt = new Date('2026-03-26T11:15:00').toISOString();
const meeting3StartedAt = new Date('2026-03-27T09:00:00').toISOString();

// ===== MEETINGS =====

export const sampleMeetings: Meeting[] = [
  {
    id: 'meeting-001',
    title: '통합검색 UX 리뷰 회의',
    projectName: '통합검색 리뉴얼',
    meetingType: '개발회의',
    startedAt: meeting1StartedAt,
    endedAt: meeting1EndedAt,
    durationMinutes: 125,
    status: '완료',
    createdAt: meeting1StartedAt,
    updatedAt: meeting1EndedAt,
  },
  {
    id: 'meeting-002',
    title: '알림장 관리자 기능 보고',
    projectName: '알림장 관리자',
    meetingType: '보고회의',
    startedAt: meeting2StartedAt,
    endedAt: meeting2EndedAt,
    durationMinutes: 75,
    status: '완료',
    createdAt: meeting2StartedAt,
    updatedAt: meeting2EndedAt,
  },
  {
    id: 'meeting-003',
    title: 'Q2 로드맵 검토',
    projectName: '서비스 기획',
    meetingType: '내부회의',
    startedAt: meeting3StartedAt,
    endedAt: null,
    durationMinutes: null,
    status: '분석중',
    createdAt: meeting3StartedAt,
    updatedAt: meeting3StartedAt,
  },
];

// ===== MEETING NOTES =====

export const sampleNotes: MeetingNote[] = [
  {
    id: 'note-001',
    meetingId: 'meeting-001',
    noteText: '현재 검색 결과 페이지 로딩 속도 이슈 - 평균 3.2초',
    isKeyPoint: true,
    createdAt: new Date('2026-03-25T14:10:00').toISOString(),
  },
  {
    id: 'note-002',
    meetingId: 'meeting-001',
    noteText: '자동완성 기능에서 오타 교정 제안 기능 추가 요청',
    isKeyPoint: false,
    createdAt: new Date('2026-03-25T14:22:00').toISOString(),
  },
  {
    id: 'note-003',
    meetingId: 'meeting-001',
    noteText: '모바일 필터 UI 개편 필요 - 현재 depth가 너무 많음',
    isKeyPoint: true,
    createdAt: new Date('2026-03-25T14:45:00').toISOString(),
  },
  {
    id: 'note-004',
    meetingId: 'meeting-001',
    noteText: '검색 결과 없을 때 추천 검색어 노출 방안 논의',
    isKeyPoint: false,
    createdAt: new Date('2026-03-25T15:10:00').toISOString(),
  },
  {
    id: 'note-005',
    meetingId: 'meeting-001',
    noteText: '다음 스프린트에 성능 개선 작업 우선 반영 결정',
    isKeyPoint: true,
    createdAt: new Date('2026-03-25T15:50:00').toISOString(),
  },
  {
    id: 'note-006',
    meetingId: 'meeting-002',
    noteText: '관리자 대시보드 권한 설정 기능 추가 요청',
    isKeyPoint: true,
    createdAt: new Date('2026-03-26T10:15:00').toISOString(),
  },
  {
    id: 'note-007',
    meetingId: 'meeting-002',
    noteText: '알림 발송 이력 엑셀 다운로드 기능 추가',
    isKeyPoint: false,
    createdAt: new Date('2026-03-26T10:40:00').toISOString(),
  },
];

// ===== MEETING RESULTS =====

export const sampleResults: MeetingResult[] = [
  {
    id: 'result-001',
    meetingId: 'meeting-001',
    summaryOneLine: '통합검색 UX 개선을 위한 성능 최적화 및 모바일 필터 개편 방향 확정',
    overview:
      '이번 회의는 통합검색 리뉴얼 프로젝트의 UX 개선을 위해 현재 서비스의 문제점을 점검하고 다음 스프린트 방향을 논의하기 위해 개최되었습니다. 현재 검색 결과 페이지의 평균 로딩 시간이 3.2초로 사용자 이탈률이 높아지고 있으며, 모바일 환경에서의 필터 UI가 복잡하다는 사용자 피드백이 지속적으로 접수되고 있는 상황입니다. 이에 따라 성능 개선, 자동완성 고도화, 모바일 필터 UX 개편을 중심으로 논의를 진행하였습니다.',
    conclusionAgreements:
      '1. 검색 결과 페이지 로딩 시간을 1.5초 이내로 단축하는 것을 다음 스프린트 최우선 목표로 설정한다.\n2. 모바일 필터 UI는 1-depth 구조로 단순화하며, 주요 필터 항목만 노출하고 나머지는 "더보기"로 접는 방식으로 개선한다.\n3. 자동완성에 오타 교정 기능을 추가하되, 우선 서버 사이드에서 처리하는 방향으로 검토한다.',
    conclusionNextSteps:
      '1. 프론트엔드 팀: 검색 결과 페이지 렌더링 최적화 (lazy loading, skeleton UI 적용) - 담당: 개발1팀\n2. 백엔드 팀: 검색 API 응답 캐싱 전략 수립 및 적용 - 담당: 서버팀\n3. 디자인 팀: 모바일 필터 UI 개편안 시안 작성 (1주일 내) - 담당: UX팀\n4. 기획 팀: 오타 교정 기능 요구사항 정의서 작성 - 담당: 기획팀',
    discussionPoints: [
      {
        id: 'dp-001',
        topic: '검색 결과 페이지 성능 이슈',
        content:
          '현재 평균 로딩 시간 3.2초는 업계 평균(1.5초)의 두 배 이상으로, 이로 인한 이탈률이 전월 대비 12% 증가하였습니다. 원인 분석 결과 이미지 최적화 미흡, 불필요한 API 중복 호출, 렌더링 블로킹 스크립트가 주요 원인으로 확인되었습니다. 프론트엔드 최적화와 백엔드 캐싱을 병행하여 1.5초 이내 달성을 목표로 합니다.',
      },
      {
        id: 'dp-002',
        topic: '모바일 필터 UI 개편 방향',
        content:
          '현재 모바일 필터는 3-depth 구조로 사용성이 낮다는 피드백이 많습니다. 경쟁사 벤치마킹 결과 1-depth 바텀시트 방식이 가장 사용성이 높았습니다. 주요 필터(카테고리, 가격대, 지역)만 상단에 노출하고 세부 필터는 "상세 필터" 버튼으로 접근하는 구조로 개편하기로 결정하였습니다.',
      },
      {
        id: 'dp-003',
        topic: '자동완성 및 오타 교정 기능 추가',
        content:
          '사용자 검색 로그 분석 결과 전체 검색의 약 18%가 오타로 인한 검색 실패로 확인되었습니다. 자동완성 오타 교정 기능을 추가하면 검색 성공률을 높일 수 있을 것으로 예상됩니다. 우선 서버 사이드에서 Elasticsearch의 fuzzy query를 활용하는 방식으로 POC를 진행한 후 클라이언트 측 개선을 검토하기로 하였습니다.',
      },
    ],
    transcriptText: `[14:00] 진행자: 안녕하세요. 오늘은 통합검색 UX 리뷰 회의를 시작하겠습니다. 먼저 현재 이슈 현황부터 공유해주시겠어요?

[14:03] 개발팀 A: 네, 최근 모니터링 데이터를 보면 검색 결과 페이지 평균 로딩 시간이 3.2초로 나타나고 있습니다. 지난달에 비해 0.4초 증가했고, 이로 인한 이탈률도 높아지고 있는 상황입니다.

[14:07] 기획팀 B: 사용자 인터뷰에서도 검색이 느리다는 피드백이 많이 나왔어요. 특히 모바일에서 필터를 사용할 때 불편하다는 의견이 많았습니다.

[14:12] 디자인팀 C: 필터 구조가 현재 3-depth인데 이게 너무 복잡하다는 거죠. 경쟁사들은 대부분 1-depth로 단순화해서 쓰고 있거든요.

[14:18] 진행자: 그럼 필터 개편 방향은 어떻게 생각하시나요?

[14:20] 디자인팀 C: 바텀시트 방식으로 1-depth로 단순화하고, 핵심 필터만 노출하는 방향이 좋을 것 같습니다. 나머지는 상세 필터로 접는 구조요.

[14:25] 개발팀 A: 구현 공수가 얼마나 될지 확인해봐야 하는데, 일단 방향성은 동의합니다.

[14:30] 기획팀 B: 그리고 자동완성에 오타 교정 기능도 추가하면 좋겠어요. 검색 로그 보면 오타로 인한 검색 실패가 18%나 되더라고요.

[14:35] 개발팀 A: Elasticsearch fuzzy query를 활용하면 서버 사이드에서 처리할 수 있을 것 같습니다. POC 먼저 해보겠습니다.

[14:45] 진행자: 성능 이슈 해결을 위한 구체적인 방안은요?

[14:47] 개발팀 A: 크게 세 가지입니다. 첫째로 이미지 최적화, 둘째로 불필요한 API 호출 제거, 셋째로 렌더링 블로킹 스크립트 정리입니다. 프론트에서 lazy loading과 skeleton UI를 적용하고, 백엔드에서는 Redis 캐싱을 도입하면 1.5초 이내로 줄일 수 있을 것으로 봅니다.

[15:00] 서버팀 D: 캐싱 전략은 제가 별도로 문서 작성해서 공유드리겠습니다. 다음 주 초까지요.

[15:10] 진행자: 검색 결과가 없을 때 추천 검색어 노출도 논의가 있었는데, 이건 어떻게 할까요?

[15:12] 기획팀 B: 이번 스프린트에서는 우선 성능 개선에 집중하고, 추천 검색어는 다음 스프린트에 넣는 게 좋을 것 같아요.

[15:15] 진행자: 네, 좋습니다. 그럼 이번 스프린트 우선순위를 정리하겠습니다.

[15:50] 진행자: 마지막으로 다음 회의는 2주 후에 스프린트 리뷰 겸 진행 상황 점검으로 진행하겠습니다. 오늘 회의 수고하셨습니다.`,
    createdAt: meeting1EndedAt,
    updatedAt: meeting1EndedAt,
  },
  {
    id: 'result-002',
    meetingId: 'meeting-002',
    summaryOneLine: '알림장 관리자 기능 추가 개발 요청 사항 확인 및 일정 협의 완료',
    overview:
      '알림장 관리자 서비스의 신규 기능 요청 사항을 정리하고 개발 일정을 협의하기 위한 보고 회의를 진행하였습니다. 운영팀에서 요청한 관리자 권한 세분화 기능과 알림 발송 이력 관리 기능이 주요 안건이었으며, 기술적 가능성 검토 및 개발 기간 산정을 완료하였습니다.',
    conclusionAgreements:
      '1. 관리자 권한을 3단계(슈퍼관리자, 운영자, 뷰어)로 세분화하여 개발한다.\n2. 알림 발송 이력은 최근 90일간 보관하며 엑셀 다운로드 기능을 제공한다.\n3. 개발 기간은 3주로 산정하며, 4월 셋째 주 배포를 목표로 한다.',
    conclusionNextSteps:
      '1. 개발팀: 권한 관리 DB 스키마 설계 및 API 개발\n2. 기획팀: 관리자 권한별 기능 정의서 작성\n3. QA팀: 권한 테스트 케이스 작성',
    discussionPoints: [
      {
        id: 'dp-004',
        topic: '관리자 권한 세분화 요청',
        content:
          '현재 관리자 계정이 단일 권한으로 운영되어 실수로 중요 데이터가 삭제되는 사고가 발생했습니다. 슈퍼관리자, 운영자, 뷰어 3단계로 권한을 나누어 각 역할에 맞는 기능만 접근 가능하도록 개선이 필요합니다.',
      },
      {
        id: 'dp-005',
        topic: '알림 발송 이력 관리',
        content:
          '발송된 알림의 이력을 확인하고 엑셀로 다운로드할 수 있는 기능이 필요합니다. 운영팀에서 월별 발송 현황을 정기 보고에 활용하고 있는데, 현재는 DB 직접 조회가 필요한 상황입니다.',
      },
    ],
    transcriptText: `[10:00] 진행자: 알림장 관리자 기능 보고 회의 시작하겠습니다.
[10:05] 운영팀: 관리자 권한 세분화 요청드립니다.
[10:30] 개발팀: 3주 일정으로 개발 가능합니다.
[11:10] 진행자: 4월 셋째 주 배포로 확정하겠습니다.`,
    createdAt: meeting2EndedAt,
    updatedAt: meeting2EndedAt,
  },
];

// ===== ACTION ITEMS =====

export const sampleActionItems: MeetingActionItem[] = [
  {
    id: 'action-001',
    meetingId: 'meeting-001',
    priorityDepth1: '최상위',
    categoryDepth2: '기획',
    taskDepth3: '검색 페이지 성능 최적화 기획',
    description: '로딩 속도 1.5초 이내 달성을 위한 프론트엔드/백엔드 최적화 방안 기획서 작성',
    status: '미실행',
    sortOrder: 1,
  },
  {
    id: 'action-002',
    meetingId: 'meeting-001',
    priorityDepth1: '최상위',
    categoryDepth2: '문서작업',
    taskDepth3: 'Redis 캐싱 전략 문서 작성',
    description: '검색 API 응답 캐싱 전략 문서화 (다음 주 월요일까지)',
    status: '완료',
    sortOrder: 2,
  },
  {
    id: 'action-003',
    meetingId: 'meeting-001',
    priorityDepth1: '상위',
    categoryDepth2: '기획',
    taskDepth3: '모바일 필터 UI 개편안 시안 작성',
    description: '1-depth 바텀시트 방식의 모바일 필터 UX 개편 시안 (1주일 내 완료)',
    status: '미실행',
    sortOrder: 3,
  },
  {
    id: 'action-004',
    meetingId: 'meeting-001',
    priorityDepth1: '상위',
    categoryDepth2: '리서치',
    taskDepth3: 'Elasticsearch fuzzy query POC',
    description: '오타 교정 자동완성 구현을 위한 fuzzy query 방식 기술 검토 및 POC 진행',
    status: '미실행',
    sortOrder: 4,
  },
  {
    id: 'action-005',
    meetingId: 'meeting-001',
    priorityDepth1: '일반',
    categoryDepth2: '문서작업',
    taskDepth3: '오타 교정 기능 요구사항 정의서 작성',
    description: '자동완성 오타 교정 기능 요구사항 정의 및 유관 부서 공유',
    status: '미실행',
    sortOrder: 5,
  },
  {
    id: 'action-006',
    meetingId: 'meeting-002',
    priorityDepth1: '최상위',
    categoryDepth2: '문서작업',
    taskDepth3: '관리자 권한별 기능 정의서 작성',
    description: '슈퍼관리자/운영자/뷰어 3단계 권한 기능 상세 정의',
    status: '미실행',
    sortOrder: 1,
  },
  {
    id: 'action-007',
    meetingId: 'meeting-002',
    priorityDepth1: '상위',
    categoryDepth2: '기획',
    taskDepth3: 'DB 스키마 설계',
    description: '권한 관리를 위한 DB 테이블 설계 및 API 명세 작성',
    status: '미실행',
    sortOrder: 2,
  },
  {
    id: 'action-008',
    meetingId: 'meeting-002',
    priorityDepth1: '일반',
    categoryDepth2: '문서작업',
    taskDepth3: 'QA 테스트 케이스 작성',
    description: '권한별 기능 접근 테스트 케이스 작성',
    status: '미실행',
    sortOrder: 3,
  },
];

// ===== DAILY WORK LOGS =====

export const sampleDailyWorkLogs: DailyWorkLog[] = [
  {
    id: 'daily-001',
    workDate: '2026-03-26',
    workStatus: '근무',
    totalMinutes: 480,
    remainingMinutes: 0,
    lmsExportText:
      '[통합검색 리뉴얼]\n- 검색 결과 페이지 성능 분석 및 개선 방안 검토 (120분)\n- 통합검색 UX 리뷰 회의 참석 (125분)\n- 모바일 필터 UI 개편안 작성 (60분)\n\n[알림장 관리자]\n- 관리자 권한 기능 정의서 초안 작성 (75분)\n- 알림 발송 이력 관리 API 설계 (100분)',
    isLmsCopied: false,
    createdAt: new Date('2026-03-26T18:00:00').toISOString(),
    updatedAt: new Date('2026-03-26T18:00:00').toISOString(),
  },
  {
    id: 'daily-002',
    workDate: '2026-03-27',
    workStatus: '근무',
    totalMinutes: 120,
    remainingMinutes: 420,
    lmsExportText:
      '[통합검색 리뉴얼]\n- Q2 로드맵 검토 회의 참석 (60분)\n- 회의 후속 업무 정리 (60분)',
    isLmsCopied: false,
    createdAt: new Date('2026-03-27T11:00:00').toISOString(),
    updatedAt: new Date('2026-03-27T11:00:00').toISOString(),
  },
];

// ===== DAILY WORK PROJECTS =====

export const sampleDailyWorkProjects: DailyWorkProject[] = [
  {
    id: 'proj-001',
    dailyWorkLogId: 'daily-001',
    projectName: '통합검색 리뉴얼',
    sortOrder: 1,
  },
  {
    id: 'proj-002',
    dailyWorkLogId: 'daily-001',
    projectName: '알림장 관리자',
    sortOrder: 2,
  },
  {
    id: 'proj-003',
    dailyWorkLogId: 'daily-002',
    projectName: '통합검색 리뉴얼',
    sortOrder: 1,
  },
];

// ===== DAILY WORK ITEMS =====

export const sampleDailyWorkItems: DailyWorkItem[] = [
  // daily-001 / proj-001 (통합검색 리뉴얼)
  {
    id: 'item-001',
    dailyWorkProjectId: 'proj-001',
    category: '리서치',
    workText: '검색 결과 페이지 성능 분석 및 개선 방안 검토',
    inputHour: 2,
    inputMinute: 0,
    durationMinutes: 120,
    sortOrder: 1,
  },
  {
    id: 'item-002',
    dailyWorkProjectId: 'proj-001',
    category: '회의',
    workText: '통합검색 UX 리뷰 회의 참석',
    inputHour: 2,
    inputMinute: 5,
    durationMinutes: 125,
    sortOrder: 2,
  },
  {
    id: 'item-003',
    dailyWorkProjectId: 'proj-001',
    category: '문서작업',
    workText: '모바일 필터 UI 개편안 초안 작성',
    inputHour: 1,
    inputMinute: 0,
    durationMinutes: 60,
    sortOrder: 3,
  },
  // daily-001 / proj-002 (알림장 관리자)
  {
    id: 'item-004',
    dailyWorkProjectId: 'proj-002',
    category: '문서작업',
    workText: '관리자 권한 기능 정의서 초안 작성',
    inputHour: 1,
    inputMinute: 15,
    durationMinutes: 75,
    sortOrder: 1,
  },
  {
    id: 'item-005',
    dailyWorkProjectId: 'proj-002',
    category: '기획',
    workText: '알림 발송 이력 관리 API 설계',
    inputHour: 1,
    inputMinute: 40,
    durationMinutes: 100,
    sortOrder: 2,
  },
  // daily-002 / proj-003 (통합검색 리뉴얼)
  {
    id: 'item-006',
    dailyWorkProjectId: 'proj-003',
    category: '회의',
    workText: 'Q2 로드맵 검토 회의 참석',
    inputHour: 1,
    inputMinute: 0,
    durationMinutes: 60,
    sortOrder: 1,
  },
  {
    id: 'item-007',
    dailyWorkProjectId: 'proj-003',
    category: '문서작업',
    workText: '회의 후속 업무 정리 및 액션 아이템 업데이트',
    inputHour: 1,
    inputMinute: 0,
    durationMinutes: 60,
    sortOrder: 2,
  },
];

// suppress unused variable warnings for date vars used only for reference
void now;
void yesterday;
void twoDaysAgo;
