import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

const ScheduleForm = React.lazy(() => import("./pages/ScheduleForm.jsx"));
const HolidayManager = React.lazy(() => import("./pages/HolidayManager.jsx"));

const App = () => {
  return (
    <Router>
      <Analytics />
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <p>Loading...</p>
        </div>
        }>
        <Routes>
          <Route path="/" element={<ScheduleForm />} />
          <Route path="/holiday" element={<HolidayManager />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
