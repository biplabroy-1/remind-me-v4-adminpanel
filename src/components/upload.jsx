import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function UploadPDFModal({ onUploadSuccess }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const eventSourceRef = useRef(null);

  // Clean up the event source when the component unmounts
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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
      // Close any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Start the upload process
      const uploadPromise = fetch("http://localhost:5000/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      // Get the response to check if the initial request was successful
      const response = await uploadPromise;

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Set up event source for progress updates from the same response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Process the stream
      const processStream = async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process any complete messages
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || ""; // Keep the last incomplete chunk

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
      };

      processStream();
    } catch (error) {
      toast.error("Error uploading file!");
      console.error("Error uploading file:", error);
      setUploading(false);
    }
  };

  const handleEventData = (data) => {
    console.log("Received update:", data);

    // Update status message
    if (data.message) {
      setStatusMessage(data.message);
    }

    // Update progress based on status
    switch (data.status) {
      case "uploading":
        setProgress(20);
        break;
      case "uploaded":
        setProgress(30);
        break;
      case "processing":
        setProgress(50);
        break;
      case "processed":
        setProgress(60);
        break;
      case "analyzing":
        setProgress(70);
        break;
      case "extracting":
        setProgress(80);
        break;
      case "complete":
        setProgress(100);
        toast.success("PDF processed successfully!");
        if (onUploadSuccess && data.data) {
          onUploadSuccess(data.data);
        }
        setTimeout(() => {
          setUploading(false);
          setOpen(false);
          setFile(null);
          setProgress(0);
          setStatusMessage("");
        }, 1000);
        break;
      case "error":
        toast.error(data.message || "Error processing PDF");
        setUploading(false);
        break;
      default:
        break;
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
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Processing..." : "Upload"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
