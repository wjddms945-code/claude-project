type BadgeVariant = 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'gray';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full',
  blue: 'bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full',
  green: 'bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full',
  red: 'bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full',
  yellow: 'bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full',
  orange: 'bg-orange-100 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full',
  gray: 'bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full',
};

export function getMeetingStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case '진행중': return 'blue';
    case '분석중': return 'yellow';
    case '완료': return 'green';
    case '오류': return 'red';
    default: return 'gray';
  }
}

export function getPriorityVariant(priority: string): BadgeVariant {
  switch (priority) {
    case '최상위': return 'red';
    case '상위': return 'orange';
    case '일반': return 'gray';
    default: return 'gray';
  }
}

export function getDailyWorkStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case '작성 완료': return 'green';
    case '작성 필요': return 'yellow';
    case '반차': return 'orange';
    case '연차': return 'orange';
    case '미작성': return 'gray';
    default: return 'gray';
  }
}

export function getWorkStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case '근무': return 'blue';
    case '반차': return 'orange';
    case '연차': return 'orange';
    default: return 'gray';
  }
}

export function getMeetingTypeVariant(_type: string): BadgeVariant {
  return 'blue';
}

export function getCategoryVariant(_category: string): BadgeVariant {
  return 'gray';
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return <span className={variantClasses[variant]}>{label}</span>;
}
