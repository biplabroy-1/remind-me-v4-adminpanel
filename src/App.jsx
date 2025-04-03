import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import ScheduleForm from "./pages/ScheduleForm.jsx";
import HolidayManager from "./pages/HolidayManager.jsx";
import { Analytics } from "@vercel/analytics/react";

const App = () => {
  return (
    <Router>
      <Analytics />
        <Routes>
          <Route path="/" element={<ScheduleForm />} />
          <Route path="/holiday" element={<HolidayManager />} />
        </Routes>
    </Router>
  );
};

export default App;
