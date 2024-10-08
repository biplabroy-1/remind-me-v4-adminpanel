import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "./Modal";

const API_BASE_URL = "https://remindme.globaltfn.tech/api/schedule";

const initialSchedule = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

const classDurations = [
  { value: 30, label: "30 minutes" },
  { value: 40, label: "40 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
];

const ScheduleForm = () => {
  const [formData, setFormData] = useState({
    ID: "",
    selectedID: "",
    university: "",
    program: "",
    section: "",
    semester: "",
    schedule: initialSchedule,
  });
  const [allIDs, setAllIDs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [currentDay, setCurrentDay] = useState("Monday");

  const fetchIDs = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ids`);
      setAllIDs(response.data.ids);
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
      const { semester, program, section, university, schedule } =
        response.data;
      setFormData((prev) => ({
        ...prev,
        semester,
        program,
        section,
        university,
        schedule,
        ID: id,
      }));
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
      setFormData((prev) => {
        const existingClasses = prev.schedule[day];
        const lastClass = existingClasses[existingClasses.length - 1];
        const startTime = lastClass ? lastClass.End_Time : "08:00";
        const newClass = {
          Period: existingClasses.length + 1,
          Start_Time: startTime,
          End_Time: calculateEndTime(startTime, 60, 1),
          Course_Name: "",
          Instructor: "",
          Room: "",
          Group: "All",
          Class_Duration: 60,
          Class_Count: 1,
          Class_type: "Theory",
        };
        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            [day]: [...prev.schedule[day], newClass],
          },
        };
      });
    },
    [calculateEndTime]
  );

  const handleRemoveClass = useCallback((day, index) => {
    setClassToDelete({ day, index });
    setIsModalOpen(true);
  }, []);

  const confirmRemoveClass = useCallback(() => {
    if (classToDelete) {
      const { day, index } = classToDelete;
      setFormData((prev) => {
        const updatedClasses = prev.schedule[day].filter(
          (_, idx) => idx !== index
        );
        const recalculatedClasses = updatedClasses.map((cls, idx) => ({
          ...cls,
          Period: idx + 1,
        }));
        return {
          ...prev,
          schedule: {
            ...prev.schedule,
            [day]: recalculatedClasses,
          },
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
      setFormData((prev) => {
        const updatedSchedule = { ...prev.schedule };
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

        return { ...prev, schedule: updatedSchedule };
      });
    },
    [calculateEndTime]
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {


        const response = await axios.post(`${API_BASE_URL}/add`, formData);
        toast.success(response.data.message);
        fetchIDs();
      } catch (error) {
        console.error("There was an error adding the schedule:", error);
        toast.error("There was an error adding the schedule.");
      }
    },
    [formData]
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

  const handleConfirmDelete = useCallback(async () => {
    try {
      setIsModalOpen(false);
      const response = await axios.delete(
        `${API_BASE_URL}/delete/${formData.selectedID}`
      );
      toast.success(response.data.message);
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, selectedID: "" }));
      fetchIDs();
      window.location.reload();
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
                parseInt(e.target.value)
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
                parseInt(e.target.value)
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
              <input
                id={`${currentDay}-instructor-${index}`}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                value={cls.Instructor}
                onChange={(e) =>
                  handleClassChange(
                    currentDay,
                    index,
                    "Instructor",
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
                type="text"
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
    [currentDay, handleRemoveClass, handleClassChange]
  );

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 mb-4 w-full max-w-full mx-auto">
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
        <div className="w-full md:w-1/3 mb-6 md:mr-4">
          <h2 className="text-xl font-bold mb-4">Schedule ID</h2>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="selectedID"
            >
              Select ID:
            </label>
            <select
              id="selectedID"
              className="shadow cursor-pointer appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.selectedID}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, selectedID: e.target.value }))
              }
            >
              <option className="hidden" value="">
                Select Existing ID
              </option>
              {allIDs.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="ID">
              ID:
            </label>
            <input
              id="ID"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              name="ID"
              value={formData.ID}
              readOnly
            />
            <button
              onClick={handleDeleteSchedules}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete This
            </button>
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
                  {i + 1}
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

          <button
            onClick={handleSubmit}
            className="bg-green-500 duration-300 hover:bg-green-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline mt-4"
          >
            Add/Update Schedule
          </button>
        </div>

        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-bold mb-4">Class Schedule</h2>
          <div className="flex mb-4 overflow-x-auto">
            {Object.keys(formData.schedule).map((day) => (
              <button
                key={day}
                className={`mr-2 px-4 py-2 rounded whitespace-nowrap ${currentDay === day ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                onClick={() => handleDayChange(day)}
              >
                {day}
              </button>
            ))}
          </div>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-700 font-bold mb-4">{currentDay}</h3>
              <button
                type="button"
                className="bg-blue-500 duration-300 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
                onClick={() => handleAddClass(currentDay)}
              >
                Add Class
              </button>
            </div>

            <div className="flex overflow-x-auto pb-4">
              {formData.schedule[currentDay].map((cls, index) =>
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