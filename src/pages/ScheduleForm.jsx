import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../components/Modal";
import { Card } from "@/components/ui/card";
import ScheduleFormHeader from "@/components/sideBarForm";
import DaySelector from "@/components/DaySelector";
import DayClassesContainer from "@/components/DayClassesContainer";

const API_BASE_URL = "https://api.remindme.globaltfn.tech/api/schedule";

const ScheduleForm = () => {
  const [schedule, setSchedule] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  });
  const [formData, setFormData] = useState({
    ID: "",
    selectedID: "",
    university: "",
    program: "",
    section: "",
    semester: "",
  });

  const [allIDs, setAllIDs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [currentDay, setCurrentDay] = useState("Monday");
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    const fetchInstructors = async () => {
      const { university, program } = formData;

      if (!university && !program) return;

      try {
        const params = new URLSearchParams();
        if (university) params.append("university", university);
        if (program) params.append("program", program);

        const response = await axios.get(
          `${API_BASE_URL}/teachers?${params.toString()}`
        );

        if (response.data && Array.isArray(response.data)) {
          setInstructors(response.data);
        }
      } catch (error) {
        console.error("Error fetching instructors:", error);
        toast.error("Error fetching instructors");
      }
    };

    fetchInstructors();
  }, [formData.university, formData.program]);

  useEffect(() => {
    const unloadCallback = (event) => {
      const e = event || window.event;
      e.preventDefault();
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => {
      window.removeEventListener("beforeunload", unloadCallback);
    };
  }, []);

  const handleInstructorChange = useCallback((day, index, newValue) => {
    const instructorName = newValue.value;
    handleClassChange(day, index, "Instructor", instructorName);
  }, []);

  const fetchIDs = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ids`);
      const allId = response.data.ids.sort();

      setAllIDs(allId);
    } catch (error) {
      console.error("Error fetching IDs:", error);
      toast.error("Error fetching IDs");
    }
  }, []);

  useEffect(() => {
    fetchIDs();
  }, [fetchIDs]);

  useEffect(() => {
    const { program, section, semester, university } = formData;
    if (program && section && semester && university) {
      setFormData((prev) => ({
        ...prev,
        ID: `${university}-${program}-${semester}-${section}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, ID: "" }));
    }
  }, [
    formData.program,
    formData.section,
    formData.semester,
    formData.university,
  ]);

  useEffect(() => {
    if (formData.selectedID) {
      fetchScheduleByID(formData.selectedID);
    }
  }, [formData.selectedID]);

  const fetchScheduleByID = useCallback(async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/find/${id}`);
      const {
        semester,
        program,
        section,
        university,
        schedule: fetchedSchedule,
      } = response.data;
      setFormData((prev) => ({
        ...prev,
        semester,
        program,
        section,
        university,
        ID: id,
      }));
      setSchedule(fetchedSchedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Error fetching schedule");
    }
  }, []);

  const calculateEndTime = useCallback((startTime, duration, count) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration * count;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
      2,
      "0"
    )}`;
  }, []);

  const handleAddClass = useCallback(
    (day) => {
      setSchedule((prev) => {
        const existingClasses = prev[day];
        const lastClass = existingClasses[existingClasses.length - 1];
        const startTime = lastClass ? lastClass.End_Time : "08:00";
        const newClass = {
          Period: existingClasses.length + 1,
          Start_Time: startTime,
          End_Time: calculateEndTime(startTime, 60, 1),
          Course_Name: "",
          Instructor: "",
          Building: "",
          Room: "",
          Group: "All",
          Class_Duration: 60,
          Class_Count: 1,
          Class_type: "Theory",
        };
        return {
          ...prev,
          [day]: [...prev[day], newClass],
        };
      });
    },
    [calculateEndTime, schedule]
  );

  const handleRemoveClass = useCallback((day, index) => {
    setClassToDelete({ day, index });
    setIsModalOpen(true);
  }, []);

  const confirmRemoveClass = useCallback(() => {
    if (classToDelete) {
      const { day, index } = classToDelete;

      setSchedule((prev) => {
        const updatedClasses = prev[day].filter((_, idx) => idx !== index);
        const recalculatedClasses = updatedClasses.map((cls, idx) => ({
          ...cls,
          Period: idx + 1,
        }));

        return {
          ...prev,
          [day]: recalculatedClasses,
        };
      });

      setIsModalOpen(false);
      setClassToDelete(null);
    }
  }, [classToDelete]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleClassChange = useCallback(
    (day, index, field, value) => {
      setSchedule((prev) => {
        const updatedSchedule = { ...prev };
        updatedSchedule[day] = [...updatedSchedule[day]];
        const updatedClass = { ...updatedSchedule[day][index], [field]: value };

        if (
          field === "Start_Time" ||
          field === "Class_Duration" ||
          field === "Class_Count"
        ) {
          updatedClass.End_Time = calculateEndTime(
            updatedClass.Start_Time,
            updatedClass.Class_Duration,
            updatedClass.Class_Count
          );
        }

        updatedSchedule[day][index] = updatedClass;

        for (let i = index + 1; i < updatedSchedule[day].length; i++) {
          const prevClass = updatedSchedule[day][i - 1];
          updatedSchedule[day][i] = {
            ...updatedSchedule[day][i],
            Start_Time: prevClass.End_Time,
            End_Time: calculateEndTime(
              prevClass.End_Time,
              updatedSchedule[day][i].Class_Duration,
              updatedSchedule[day][i].Class_Count
            ),
          };
        }

        return updatedSchedule;
      });
    },
    [calculateEndTime]
  );

  const handleSubmit = useCallback(
    async (e) => {
      if (allIDs.includes(formData.ID) && formData.selectedID !== formData.ID) {
        toast.error(
          "ID already exists in the database, please select another ID"
        );
        return;
      }
      e.preventDefault();
      try {
        const dataToSubmit = {
          ...formData,
          schedule: schedule,
        };
        const response = await axios.post(`${API_BASE_URL}/add`, dataToSubmit);
        toast.success(response.data.message);
        fetchIDs();
      } catch (error) {
        console.error("There was an error adding the schedule:", error);
        toast.error("There was an error adding the schedule.");
      }
    },
    [formData, schedule, allIDs, fetchIDs]
  );

  const handleDeleteSchedules = useCallback(
    (e) => {
      e.preventDefault();
      if (!formData.selectedID) {
        toast.warn("Nothing is selected");
        return;
      }
      setIsModalOpen(true);
    },
    [formData.selectedID]
  );

  const uploadSuccess = useCallback((data) => {
    console.log("Upload successful:", data);
    setSchedule(data.schedule);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsModalOpen(false);
      const response = await axios.delete(
        `${API_BASE_URL}/delete/${formData.selectedID}`
      );
      toast.success(response.data.message);

      setFormData({
        ID: "",
        selectedID: "",
        university: "",
        program: "",
        section: "",
        semester: "",
      });

      setSchedule({
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
      });

      fetchIDs();
    } catch (error) {
      console.error("There was an error deleting the schedule:", error);
      toast.error("There was an error deleting the schedule.");
    }
  }, [formData.selectedID, fetchIDs]);

  const handleDayChange = useCallback((day) => {
    setCurrentDay(day);
  }, []);

  return (
    <Card className="p-8 w-full max-w-full min-h-screen">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex flex-col md:flex-row">
        <ScheduleFormHeader
          formData={formData}
          setFormData={setFormData}
          allIDs={allIDs}
          handleInputChange={handleInputChange}
          handleDeleteSchedules={handleDeleteSchedules}
          handleSubmit={handleSubmit}
        />

        <div className="w-full md:w-3/4">
          <h2 className="text-xl font-bold mb-4">Class Schedule</h2>
          <DaySelector
            schedule={schedule}
            currentDay={currentDay}
            handleDayChange={handleDayChange}
          />

          <DayClassesContainer
            currentDay={currentDay}
            schedule={schedule}
            handleAddClass={handleAddClass}
            formData={formData}
            onUploadSuccess={uploadSuccess}
            handleRemoveClass={handleRemoveClass}
            handleClassChange={handleClassChange}
            handleInstructorChange={handleInstructorChange}
            instructors={instructors}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={classToDelete ? confirmRemoveClass : handleConfirmDelete}
        message={
          classToDelete
            ? "Are you sure you want to delete this class?"
            : "Are you sure you want to delete this schedule?"
        }
      />
    </Card>
  );
};

export default React.memo(ScheduleForm);
