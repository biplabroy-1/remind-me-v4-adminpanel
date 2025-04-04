import React, { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import CreatableSelect from "react-select/creatable";
import { useId } from "react";

const ClassForm = ({
  cls,
  index,
  day,
  handleRemoveClass,
  handleClassChange,
  handleInstructorChange,
  instructors,
}) => {
  const id = useId();

  // Generate dynamic class durations
  const classDurations = useMemo(() => {
    const commonDurations = [30, 40, 45, 50, 60, 90, 120]; // Most commonly used durations

    return commonDurations.map((duration) => {
      let label;
      if (duration < 60) {
        label = `${duration} minutes`;
      } else if (duration === 60) {
        label = "1 hour";
      } else {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        label =
          minutes > 0
            ? `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minutes`
            : `${hours} hour${hours > 1 ? "s" : ""}`;
      }
      return { value: duration, label };
    });
  }, []);

  // Generate class counts from 1 to 5
  const classCounts = useMemo(() => [1, 2, 3, 4, 5], []);

  // Class type options
  const classTypes = useMemo(
    () => [
      { value: "Theory", label: "Theory" },
      { value: "Lab", label: "Lab" },
      { value: "Free", label: "Free" },
    ],
    []
  );

  // Group options
  const groupOptions = useMemo(
    () => [
      { value: "All", label: "All" },
      { value: "Group 1", label: "Group 1" },
      { value: "Group 2", label: "Group 2" },
    ],
    []
  );

  return (
    <Card className="min-w-[300px] mr-4 bg-gray-100">
      <CardHeader className="flex justify-end p-3 pb-0">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleRemoveClass(day, index)}
          className="h-8"
        >
          Remove
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-2">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={`${id}-start-time-${index}`}>Start Time:</Label>
            <Input
              id={`${id}-start-time-${index}`}
              type="time"
              value={cls.Start_Time}
              onChange={(e) =>
                handleClassChange(day, index, "Start_Time", e.target.value)
              }
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={`${id}-class-duration-${index}`}>
              Class Duration:
            </Label>
            <Select
              className="w-full"
              value={cls.Class_Duration.toString()}
              onValueChange={(value) =>
                handleClassChange(
                  day,
                  index,
                  "Class_Duration",
                  Number.parseInt(value)
                )
              }
            >
              <SelectTrigger id={`${id}-class-duration-${index}`}>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {classDurations.map((duration) => (
                    <SelectItem
                      key={duration.value}
                      value={duration.value.toString()}
                    >
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={`${id}-class-count-${index}`}>Class Count:</Label>
            <Select
              className="w-full"
              value={cls.Class_Count.toString()}
              onValueChange={(value) =>
                handleClassChange(
                  day,
                  index,
                  "Class_Count",
                  Number.parseInt(value)
                )
              }
            >
              <SelectTrigger id={`${id}-class-count-${index}`}>
                <SelectValue placeholder="Select count" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {classCounts.map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={`${id}-class-type-${index}`}>Class Type:</Label>
            <Select
              className="w-full"
              value={cls.Class_type}
              onValueChange={(value) =>
                handleClassChange(day, index, "Class_type", value)
              }
            >
              <SelectTrigger id={`${id}-class-type-${index}`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {classTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {cls.Class_type !== "Free" && (
            <>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor={`${id}-course-name-${index}`}>
                  Course Name:
                </Label>
                <Input
                  id={`${id}-course-name-${index}`}
                  type="text"
                  value={cls.Course_Name}
                  onChange={(e) =>
                    handleClassChange(day, index, "Course_Name", e.target.value)
                  }
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor={`${id}-instructor-${index}`}>Instructor:</Label>
                <div className="flex h-10">
                  <CreatableSelect
                    id={`${id}-instructor-${index}`}
                    className="w-full"
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        minHeight: "40px",
                      }),
                    }}
                    value={
                      cls.Instructor
                        ? { value: cls.Instructor, label: cls.Instructor }
                        : null
                    }
                    onChange={(newValue) =>
                      handleInstructorChange(day, index, newValue)
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
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor={`${id}-building-${index}`}>Building:</Label>
                <Input
                  id={`${id}-building-${index}`}
                  type="text"
                  value={cls.Building}
                  onChange={(e) =>
                    handleClassChange(day, index, "Building", e.target.value)
                  }
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor={`${id}-room-${index}`}>Room:</Label>
                <Input
                  id={`${id}-room-${index}`}
                  type="number"
                  value={cls.Room}
                  onChange={(e) =>
                    handleClassChange(day, index, "Room", e.target.value)
                  }
                  required
                />
              </div>
            </>
          )}

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor={`${id}-group-${index}`}>Group:</Label>
            <Select
              className="w-full"
              value={cls.Group}
              onValueChange={(value) =>
                handleClassChange(day, index, "Group", value)
              }
            >
              <SelectTrigger id={`${id}-group-${index}`}>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groupOptions.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(ClassForm);
