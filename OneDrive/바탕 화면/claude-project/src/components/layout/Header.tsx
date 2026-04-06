import { NavLink } from 'react-router-dom';

export function Header() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium px-3 py-2 rounded-md transition-colors ${
      isActive
        ? 'text-blue-700 bg-blue-50'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-700 rounded-md flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              {/* Head */}
              <circle cx="7.5" cy="8" r="3" />
              {/* Left ear */}
              <path d="M5.5 6 L4.5 3.5 L7 5z" />
              {/* Right ear */}
              <path d="M9.5 6 L10.5 3.5 L8 5z" />
              {/* Body */}
              <ellipse cx="8" cy="13" rx="3" ry="2.5" />
              {/* Tail */}
              <path d="M11 12 Q15 10 14.5 6.5 Q14 4.5 12.5 5.5 Q11.5 7 12.5 9 Q13 11 11 12z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm">Jungeun Workroom</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            홈
          </NavLink>
          <NavLink to="/meetings" className={navLinkClass}>
            회의
          </NavLink>
          <NavLink to="/daily-work" className={navLinkClass}>
            업무
          </NavLink>
          <span className="mx-1 text-gray-200">|</span>
          <NavLink to="/projects" className={navLinkClass}>
            프로젝트
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
