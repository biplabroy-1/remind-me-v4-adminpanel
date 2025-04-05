import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";

export default function UploadPDFModal({ onUploadSuccess }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const eventSourceRef = useRef(null);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatusMessage("Starting upload...");
    setProgress(10);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const response = await fetch("https://api.remindme.globaltfn.tech/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              handleEventData(data);
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      toast.error("Error uploading file!");
      console.error("Error uploading file:", error);
      setUploading(false);
    }
  };

  const handleEventData = (data) => {
    console.log("Received update:", data);

    if (data.message) {
      setStatusMessage(data.message);
      console.log(data.message);
      
      let newProgress = progress;
      switch (data.status) {
        case "uploading":
          newProgress = data.progress;
          break;
        case "uploaded":
          newProgress = data.progress;
          break;
        case "processing":
          newProgress = data.progress;
          break;
        case "processed":
          newProgress = data.progress;
          break;
        case "analyzing":
          newProgress = data.progress;
          break;
        case "extracting":
          newProgress = data.progress;
          break;
        case "finalizing":
          newProgress = data.progress;
          break;
        case "extracted":
          newProgress = data.progress;
          break;
        case "complete":
          newProgress = 100;
          if (data.status === "complete"){
            toast.success(data.message);
          }else{
            toast.error(data.message.substring(0, 30)); 
          }
          break;
        default:
          break;
      }

      setProgress(newProgress);
    }

    if (data.status === "complete") {
      console.log("This is the data", data);
      
      // Check if the data contains a non-timetable message
      if (data.type === "text" && typeof data.data === 'string') {
        console.log("Received non-timetable data");
        toast.error("Please upload a valid academic timetable");
        setUploading(false);
        setOpen(false);
        setFile(null);
        setProgress(0);
        setStatusMessage("");
        return; // Exit early without calling onUploadSuccess
      }

      if (data.data.status === "error" || data.data.type === "text") {
        console.log("error");
        toast.error(data.data.message);
        setUploading(false);
      } else if (onUploadSuccess && data.data) {
        onUploadSuccess(data.data);
      }
      
      setTimeout(() => {
        setUploading(false);
        setOpen(false);
        setFile(null);
        setProgress(0);
        setStatusMessage("");
      }, 1000);
    } else if (data.status === "error") {
      setUploading(false);
    }
  };

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setOpen(true)}>
        Upload PDF
      </Button>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!uploading) setOpen(isOpen);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload PDF</DialogTitle>
          </DialogHeader>
          {!uploading ? (
            <input
              className="p-4 border rounded-2xl border-dashed"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
            />
          ) : (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-sm text-gray-500">
                {statusMessage}
              </p>
            </div>
          )}
          <div className="flex justify-end mt-4">
            {!uploading && (
              <Button
                onClick={handleUpload}
                disabled={!file}
                className="ml-2"
              >
                Upload
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
