import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/StoreProvider.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Program from './pages/Program.jsx'
import LessonView from './pages/LessonView.jsx'
import LessonEditor from './pages/LessonEditor.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Sessions from './pages/Sessions.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/program" element={<Program />} />
            <Route path="/lessons/new" element={<LessonEditor />} />
            <Route path="/lessons/:id" element={<LessonView />} />
            <Route path="/lessons/:id/edit" element={<LessonEditor />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  )
}
