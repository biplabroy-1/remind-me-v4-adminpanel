import React from "react";
import { Button } from "@/components/ui/button";

const DaySelector = ({ schedule, currentDay, handleDayChange }) => {
  return (
    <div className="flex overflow-x-auto mb-4 pb-2">
      {Object.keys(schedule).map((day) => (
        <Button
          key={day}
          variant={currentDay === day ? "default" : "outline"}
          className="mr-2 whitespace-nowrap"
          onClick={() => handleDayChange(day)}
        >
          {day}
        </Button>
      ))}
    </div>
  );
};

export default React.memo(DaySelector);
