import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import MeetingNew from './pages/meetings/MeetingNew';
import MeetingLive from './pages/meetings/MeetingLive';
import MeetingDetail from './pages/meetings/MeetingDetail';
import MeetingHistory from './pages/meetings/MeetingHistory';
import DailyWorkNew from './pages/daily-work/DailyWorkNew';
import DailyWorkHistory from './pages/daily-work/DailyWorkHistory';
import DailyWorkDetail from './pages/daily-work/DailyWorkDetail';
import WeeklyReport from './pages/daily-work/WeeklyReport';
import ProjectsPage from './pages/projects';
import ProjectDetail from './pages/projects/ProjectDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="meetings" element={<MeetingHistory />} />
          <Route path="meetings/new" element={<MeetingNew />} />
          <Route path="meetings/:id/live" element={<MeetingLive />} />
          <Route path="meetings/:id" element={<MeetingDetail />} />
          <Route path="daily-work" element={<DailyWorkHistory />} />
          <Route path="daily-work/new" element={<DailyWorkNew />} />
          <Route path="daily-work/weekly-report" element={<WeeklyReport />} />
          <Route path="daily-work/:id" element={<DailyWorkDetail />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
