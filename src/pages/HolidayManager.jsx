import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://api.remindme.globaltfn.tech/api/holiday";

const HolidayManager = () => {
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dayCount, setDayCount] = useState(1);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetchHolidays();
  }, []);

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

  const fetchHolidays = async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      const combinedHolidays = combineHolidays(response.data);
      setHolidays(combinedHolidays);
      console.log(combinedHolidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setNotification("Error fetching holidays. Please try again.");
    }
  };

  const combineHolidays = (holidayList) => {
    const holidayMap = {};

    holidayList.forEach((holiday) => {
      if (holidayMap[holiday.name]) {
        // Combine dates if the holiday name already exists
        holidayMap[holiday.name].dates.push(holiday.date);
      } else {
        // Initialize the holiday entry
        holidayMap[holiday.name] = {
          name: holiday.name,
          dates: [holiday.date],
          _id: holiday._id, // Keep the ID of the first holiday
        };
      }
    });

    // Convert the map back to an array
    return Object.values(holidayMap).map((holiday) => {
      const dates = holiday.dates;
      const start = dates[0];
      const end = dates[dates.length - 1];
      const dateString =
        dates.length > 2 ? `${start} - ${end}` : dates.join(", "); // Show range or list of dates

      return {
        ...holiday,
        date: dateString,
      };
    });
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddHolidays = async () => {
    if (!name || !startDate) {
      setNotification("Please enter a holiday name and start date.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + dayCount - 1);

    try {
      const holidaysToAdd = [];
      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        holidaysToAdd.push({ name, date: formatDate(new Date(date)) });
      }

      await Promise.all(
        holidaysToAdd.map((holiday) => axios.post(`${API_URL}/add`, holiday))
      );

      setNotification("Holidays added successfully.");
      fetchHolidays();
      setName("");
      setStartDate("");
      setDayCount(1);
    } catch (error) {
      console.error("Error adding holidays:", error);
      setNotification("Failed to add holidays.");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!id) {
      console.error("No ID provided for deletion.");
      setNotification("No holiday ID specified for deletion.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        const response = await axios.delete(`${API_URL}/delete/${id}`);
        setNotification(response.data.message);
        fetchHolidays();
      } catch (error) {
        console.error("Error deleting holiday:", error);
        setNotification("Failed to delete holiday: " + error.message);
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-4xl font-semibold mb-4">Holiday Manager</h2>
      {notification && (
        <div className="bg-blue-100 text-blue-700 p-3 rounded-lg mb-4">
          {notification}
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Holiday Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={dayCount}
          onChange={(e) => setDayCount(Math.max(1, e.target.value))}
          className="border p-3 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
        <button
          onClick={handleAddHolidays}
          className="bg-blue-600 text-white p-3 rounded-lg shadow hover:bg-blue-700 transition duration-200"
        >
          Add Holidays
        </button>
      </div>

      <h2 className="text-3xl font-semibold mt-6 mb-2">All Holidays</h2>
      <ul className="list-disc pl-5">
        {holidays.map((holiday) => (
          <li
            key={holiday._id}
            className="flex justify-between items-center bg-white p-3 rounded-lg shadow mb-2"
          >
            <span>
              {holiday.name} - {holiday.date}
            </span>
            <button
              onClick={() => handleDeleteHoliday(holiday._id)}
              className="text-red-600 hover:text-red-800 transition duration-200"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HolidayManager;
