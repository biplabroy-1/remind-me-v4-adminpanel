import React from "react";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const ScheduleFormHeader = ({
  formData,
  setFormData,
  allIDs,
  handleInputChange,
  handleDeleteSchedules,
  handleSubmit,
}) => {
return (
    <Card className="w-full md:w-1/4 mr-4">
        <CardContent className="py-6">
            <h2 className="text-xl font-bold mb-4">Schedule ID</h2>

            <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="selectedID">Select ID:</Label>
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

                <div className="grid w-full items-center gap-1.5">
                    <p className="text-sm font-medium">
                        Selected ID:{" "}
                        <span className="text-gray-500 font-normal">{formData.ID}</span>
                    </p>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteSchedules}
                        disabled={formData.ID === ""}
                        className="w-full"
                    >
                        Delete This
                    </Button>
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="university">University:</Label>
                    <Input
                        id="university"
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        placeholder="Enter university (e.g., BWU)"
                    />
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="program">Program:</Label>
                    <Input
                        id="program"
                        type="text"
                        name="program"
                        value={formData.program}
                        onChange={handleInputChange}
                        placeholder="Enter Program (e.g., BCA)"
                    />
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="semester">Semester:</Label>
                    <Select
                        id="semester"
                        className="w-full"
                        classNamePrefix="react-select"
                        name="semester"
                        value={formData.semester ? { value: formData.semester, label: `${formData.semester} - ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][formData.semester-1]}` } : null}
                        onChange={(selectedOption) =>
                            handleInputChange({
                                target: {
                                    name: "semester",
                                    value: selectedOption ? selectedOption.value : "",
                                },
                            })
                        }
                        options={Array.from({ length: 9 }, (_, i) => ({
                            value: i + 1,
                            label: `${i + 1} - ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][i]}`,
                        }))}
                        placeholder="Select Semester"
                    />
                </div>

                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="section">Section:</Label>
                    <Input
                        id="section"
                        type="text"
                        name="section"
                        className="uppercase"
                        value={formData.section}
                        onChange={handleInputChange}
                        placeholder="Enter Section (e.g., A)"
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    variant="default"
                    className={`w-full ${
                        allIDs.includes(formData.ID) &&
                        formData.selectedID !== formData.ID
                            ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                            : ""
                    }`}
                    disabled={
                        allIDs.includes(formData.ID) &&
                        formData.selectedID !== formData.ID
                    }
                >
                    Add/Update Schedule
                </Button>
            </div>
        </CardContent>
    </Card>
);
};

export default React.memo(ScheduleFormHeader);
