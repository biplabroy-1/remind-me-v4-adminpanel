import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../components/Modal";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { Button } from "@/components/ui/button";
import UploadPDFModal from "@/components/upload";

const API_BASE_URL = "https://api.remindme.globaltfn.tech/api/schedule";

const classDurations = [
  { value: 30, label: "30 minutes" },
  { value: 40, label: "40 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
];

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
          // Store the full instructor objects to use their details
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
      e.returnValue = ""; // This line is necessary for some browsers to show the confirmation dialog
      return ""; // This line is necessary for some browsers to show the confirmation dialog
    };

    window.addEventListener("beforeunload", unloadCallback);
    return () => {
      // Cleanup function
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

      // Update schedule state instead of formData
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
    setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
  }, []);

  const handleClassChange = useCallback(
    (day, index, field, value) => {
      setSchedule((prev) => {
        // Create a shallow copy of the schedule
        const updatedSchedule = { ...prev };
        // Only deep clone the specific day's array that's changing
        updatedSchedule[day] = [...updatedSchedule[day]];
        // Create a shallow copy of just the class being modified
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

        // Update subsequent classes' start times
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

      // Reset form state
      setFormData({
        ID: "",
        selectedID: "",
        university: "",
        program: "",
        section: "",
        semester: "",
      });

      // Reset schedule state
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

  const renderClassForm = useMemo(
    () => (cls, index) =>
      (
        <div
          key={index}
          className="bg-gray-100 p-6 rounded-lg mr-4 min-w-[300px]"
        >
          <button
            type="button"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mb-2 float-right"
            onClick={() => handleRemoveClass(currentDay, index)}
          >
            Remove
          </button>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor={`${currentDay}-start-time-${index}`}
            >
              Start Time:
            </label>
            <input
              id={`${currentDay}-start-time-${index}`}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="time"
              value={cls.Start_Time}
              onChange={(e) =>
                handleClassChange(
                  currentDay,
                  index,
                  "Start_Time",
                  e.target.value
                )
              }
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor={`${currentDay}-class-duration-${index}`}
            >
              Class Duration:
            </label>
            <select
              id={`${currentDay}-class-duration-${index}`}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={cls.Class_Duration}
              onChange={(e) =>
                handleClassChange(
                  currentDay,
                  index,
                  "Class_Duration",
                  Number.parseInt(e.target.value)
                )
              }
            >
              {classDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor={`${currentDay}-class-count-${index}`}
            >
              Class Count:
            </label>
            <select
              id={`${currentDay}-class-count-${index}`}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={cls.Class_Count}
              onChange={(e) =>
                handleClassChange(
                  currentDay,
                  index,
                  "Class_Count",
                  Number.parseInt(e.target.value)
                )
              }
            >
              {[1, 2, 3, 4].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor={`${currentDay}-class-type-${index}`}
            >
              Class Type:
            </label>
            <select
              id={`${currentDay}-class-type-${index}`}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={cls.Class_type}
              onChange={(e) =>
                handleClassChange(
                  currentDay,
                  index,
                  "Class_type",
                  e.target.value
                )
              }
            >
              <option value="Theory">Theory</option>
              <option value="Lab">Lab</option>
              <option value="Free">Free</option>
            </select>
          </div>

          {cls.Class_type !== "Free" && (
            <>
              <div className="mb-4">
                <label
                  className="block text-gray-700 font-bold mb-2"
                  htmlFor={`${currentDay}-course-name-${index}`}
                >
                  Course Name:
                </label>
                <input
                  id={`${currentDay}-course-name-${index}`}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  value={cls.Course_Name}
                  onChange={(e) =>
                    handleClassChange(
                      currentDay,
                      index,
                      "Course_Name",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 font-bold mb-2"
                  htmlFor={`${currentDay}-instructor-${index}`}
                >
                  Instructor:
                </label>
                <CreatableSelect
                  id={`${currentDay}-instructor-${index}`}
                  className="shadow"
                  value={{ value: cls.Instructor, label: cls.Instructor }}
                  onChange={(newValue) =>
                    handleInstructorChange(currentDay, index, newValue)
                  }
                  options={instructors.map((instructor) => ({
                    value: instructor.name,
                    label: `${instructor.name}`,
                  }))}
                  formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                  isClearable
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 font-bold mb-2"
                  htmlFor={`${currentDay}-building-${index}`}
                >
                  Building:
                </label>
                <input
                  id={`${currentDay}-building-${index}`}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  value={cls.Building}
                  onChange={(e) =>
                    handleClassChange(
                      currentDay,
                      index,
                      "Building",
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 font-bold mb-2"
                  htmlFor={`${currentDay}-room-${index}`}
                >
                  Room:
                </label>
                <input
                  id={`${currentDay}-room-${index}`}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="number"
                  value={cls.Room}
                  onChange={(e) =>
                    handleClassChange(currentDay, index, "Room", e.target.value)
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor={`${currentDay}-group-${index}`}
            >
              Group:
            </label>
            <select
              id={`${currentDay}-group-${index}`}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={cls.Group}
              onChange={(e) =>
                handleClassChange(currentDay, index, "Group", e.target.value)
              }
            >
              <option value="All">All</option>
              <option value="Group 1">Group 1</option>
              <option value="Group 2">Group 2</option>
            </select>
          </div>
        </div>
      ),
    [
      currentDay,
      handleRemoveClass,
      handleClassChange,
      handleInstructorChange,
      instructors,
    ]
  );
  return (
    <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-full min-h-screen">
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
        transition:Bounce
      />
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 mb-6 md:mr-4">
          <h2 className="text-xl font-bold mb-4">Schedule ID</h2>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="selectedID"
            >
              Select ID:
            </label>
            <Select
              id="selectedID"
              className="w-full"
              classNamePrefix="react-select"
              value={
                allIDs.find((id) => id === formData.selectedID)
                  ? { value: formData.selectedID, label: formData.selectedID }
                  : null
              }
              onChange={(selectedOption) =>
                setFormData((prev) => ({
                  ...prev,
                  selectedID: selectedOption ? selectedOption.value : "",
                }))
              }
              options={[...allIDs.map((id) => ({ value: id, label: id }))]}
              placeholder="Select Existing ID"
              isClearable
            />
          </div>

          <div className="mb-4">
            <p className="text-gray-700 font-bold mb-2 block">
              Selected ID:{" "}
              <span className="text-gray-500 font-normal">{formData.ID}</span>
            </p>
            <Button
              onClick={handleDeleteSchedules}
              disabled={formData.ID === ""}
              className={`mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                formData.ID === "" ? "cursor-not-allowed" : ""
              }`}
            >
              Delete This
            </Button>
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

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="university"
            >
              University:
            </label>
            <input
              id="university"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              name="university"
              value={formData.university}
              onChange={handleInputChange}
              placeholder="Enter university (e.g., BWU)"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="program"
            >
              Program:
            </label>
            <input
              id="program"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              placeholder="Enter Program (e.g., BCA)"
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="semester"
            >
              Semester:
            </label>
            <select
              id="semester"
              className="shadow cursor-pointer appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
            >
              <option className="hidden" value="">
                Select Semester
              </option>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} -{" "}
                  {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][i]}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="section"
            >
              Section:
            </label>
            <input
              id="section"
              className="shadow uppercase appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              placeholder="Enter Section (e.g., A)"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className={`duration-300 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline mt-4 ${
              allIDs.includes(formData.ID) &&
              formData.selectedID !== formData.ID
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-700"
            }`}
          >
            Add/Update Schedule
          </Button>
        </div>

        <div className="w-full md:w-3/4">
          <h2 className="text-xl font-bold mb-4">Class Schedule</h2>
          <div className="flex mb-4 overflow-x-auto">
            {Object.keys(schedule).map((day) => (
              <Button
                key={day}
                className={`mr-2 px-4 py-2 rounded whitespace-nowrap ${
                  currentDay === day ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
                onClick={() => handleDayChange(day)}
              >
                {day}
              </Button>
            ))}
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-700 font-bold">{currentDay}</h3>
              <div className="flex gap-4 items-center justify-center">
                <UploadPDFModal onUploadSuccess={uploadSuccess} />
                <Button
                  type="button"
                  className={`duration-300 text-white font-bold py-2 px-4 cursor-pointer rounded ${
                    formData.ID === ""
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-700"
                  } transform hover:scale-105 transition-transform`}
                  onClick={() => handleAddClass(currentDay)}
                  disabled={formData.ID === ""}
                >
                  <span className="mr-2">➕</span>
                  {formData.ID === ""
                    ? "Please select an ID first"
                    : "Add a new class"}
                </Button>
              </div>
            </div>

            <div className="flex overflow-x-auto pb-4">
              {schedule[currentDay].map((cls, index) =>
                renderClassForm(cls, index)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScheduleForm);
