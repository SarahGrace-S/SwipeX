import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobDiscovery from './pages/JobDiscovery';
import SavedJobs from './pages/SavedJobs';
import AppliedJobs from './pages/AppliedJobs';
import Companies from './pages/Companies';
import Search from './pages/Search';
import ApplicationForm from './pages/ApplicationForm';
import Profile from './pages/Profile';
import PostJob from './pages/recruiter/PostJob';
import ManageJobs from './pages/recruiter/ManageJobs';
import ViewApplicants from './pages/recruiter/ViewApplicants';
import CompanyProfile from './pages/recruiter/CompanyProfile';
import Analytics from './pages/recruiter/Analytics';
import Notifications from './pages/Notifications';
import Recommendations from './pages/Recommendations';
import ResumeAnalysis from './pages/ResumeAnalysis';
import ATSFeedback from './pages/ATSFeedback';
import CareerAssistant from './pages/CareerAssistant';
import Layout from './components/Layout';

const LayoutWrapper = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/landing" element={<Home />} />
        
        
        <Route element={<LayoutWrapper />}>
          <Route path="/discover" element={<JobDiscovery />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/jobseeker" element={<JobSeekerDashboard />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/recruiter/post-job" element={<PostJob />} />
          <Route path="/recruiter/edit-job/:jobId" element={<PostJob />} />
          <Route path="/recruiter/jobs" element={<ManageJobs />} />
          <Route path="/recruiter/applicants" element={<ViewApplicants />} />
          <Route path="/recruiter/company-profile" element={<CompanyProfile />} />
          <Route path="/recruiter/analytics" element={<Analytics />} />
          <Route path="/saved-jobs" element={<SavedJobs />} />
          <Route path="/applied-jobs" element={<AppliedJobs />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/search" element={<Search />} />
          <Route path="/apply/:jobId" element={<ApplicationForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/resume-analysis" element={<ResumeAnalysis />} />
          <Route path="/ats-feedback" element={<ATSFeedback />} />
          <Route path="/career-assistant" element={<CareerAssistant />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" theme="dark" />
    </Router>
  );
}

export default App;
