"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";

interface Student {
  "Student Name"?: string;
  "Parent Phone"?: string;
  "Week Date"?: string;
  "Attendance"?: string;
  "Math Test Marks"?: string;
  "Max Marks"?: string;
  "Teacher Remarks"?: string;
  "Teacher Remark"?: string;
  "Status"?: string;
  "Batch"?: string;
  "Class"?: string;
}

const REMARK_PRESETS = [
  "Good performance, keep it up!",
  "Excellent understanding of concepts.",
  "Very attentive and active in class.",
  "Needs to practice calculations more.",
  "Did not submit homework. Needs improvement.",
  "Absent for weekly test."
];

const getWeekSaturday = (date: Date = new Date()): string => {
  const resultDate = new Date(date);
  const day = resultDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -1 : 6 - day;
  resultDate.setDate(resultDate.getDate() + diff);
  return resultDate.toISOString().split("T")[0];
};

export default function Dashboard() {
  // Navigation & Config
  const [currentView, setCurrentView] = useState<"dashboard" | "teacher-input" | "settings">("dashboard");
  const [scriptUrl, setScriptUrl] = useState("");
  const [teacherPin, setTeacherPin] = useState("1234");
  const [enteredPin, setEnteredPin] = useState("");
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  
  // Modals & Overlay
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Filters
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("All");

  // Teacher Input Mode - Batch Entry Form States
  // Store grades: { [studentName]: { marks: string, remarks: string } }
  const [batchGrades, setBatchGrades] = useState<Record<string, { marks: string; remarks: string }>>({});
  // Store attendance checklist: { [studentName]: boolean } (true = Present, false = Absent)
  const [attendanceChecklist, setAttendanceChecklist] = useState<Record<string, boolean>>({});
  
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [inputDate, setInputDate] = useState("");

  // WhatsApp Broadcast Wizard State
  const [broadcastQueue, setBroadcastQueue] = useState<Student[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [apiUpdatingStatus, setApiUpdatingStatus] = useState(false);

  // Daily Attendance Manager States
  const [teacherSubView, setTeacherSubView] = useState<"attendance" | "grades" | "add-student">("attendance");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  // Add Student Form States
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentPhone, setNewStudentPhone] = useState("");
  const [newStudentClass, setNewStudentClass] = useState("");
  const [newStudentBatch, setNewStudentBatch] = useState("3pm");
  const [studentAdding, setStudentAdding] = useState(false);

  // Robust helper to get case-insensitive and spelling-flexible values from the Google Sheets JSON
  const getValue = (student: Student, keys: string[]): string => {
    if (!student) return "";
    for (const key of keys) {
      const val = student[key as keyof Student];
      if (val !== undefined && val !== null) {
        return String(val).trim();
      }
    }
    return "";
  };

  // Normalizes batch value to match dashboard filter tags ("3pm", "4pm", etc.)
  const getNormalizedBatch = (batchStr: string): string => {
    if (!batchStr) return "";
    const cleaned = batchStr.trim().toLowerCase();
    if (cleaned.startsWith("15:00") || cleaned.startsWith("15.00") || cleaned.startsWith("3:") || cleaned === "3pm" || cleaned.includes("3")) return "3pm";
    if (cleaned.startsWith("16:00") || cleaned.startsWith("16.00") || cleaned.startsWith("4:") || cleaned === "4pm" || cleaned.includes("4")) return "4pm";
    if (cleaned.startsWith("17:00") || cleaned.startsWith("17.00") || cleaned.startsWith("5:") || cleaned === "5pm" || cleaned.includes("5")) return "5pm";
    if (cleaned.startsWith("18:00") || cleaned.startsWith("18.00") || cleaned.startsWith("6:") || cleaned === "6pm" || cleaned.includes("6")) return "6pm";
    if (cleaned.startsWith("19:00") || cleaned.startsWith("19.00") || cleaned.startsWith("7:") || cleaned === "7pm" || cleaned.includes("7")) return "7pm";
    return batchStr;
  };

  // 1. Initial configuration loading
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("raj_academy_script_url") || "";
      const savedPin = localStorage.getItem("raj_academy_teacher_pin") || "1234";
      setScriptUrl(savedUrl);
      setTeacherPin(savedPin);
      
      const saturday = getWeekSaturday(new Date());
      setInputDate(saturday);
      
      const todayStr = new Date().toISOString().split("T")[0];
      setAttendanceDate(todayStr);
      
      if (savedUrl) {
        fetchStudents(savedUrl);
      } else {
        setShowSettingsModal(true);
      }
    }
  }, []);

  // 2. Fetch data from Google Apps Script
  const fetchStudents = async (targetUrl = scriptUrl) => {
    if (!targetUrl) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(targetUrl);
      const resData = await response.json();
      if (resData.status === "success") {
        setStudents(resData.data);
        
        // Populate initial batch grades and attendance from fetched data
        const initialGrades: Record<string, { marks: string; remarks: string }> = {};
        const initialAttendance: Record<string, boolean> = {};
        
        resData.data.forEach((st: Student) => {
          const name = getValue(st, ["Student Name"]);
          if (name) {
            initialGrades[name] = {
              marks: getValue(st, ["Math Test Marks"]),
              remarks: getValue(st, ["Teacher Remarks", "Teacher Remark"])
            };
            initialAttendance[name] = true; // Default all to Present for the day
          }
        });
        
        setBatchGrades(initialGrades);
        setAttendanceChecklist(initialAttendance);
      } else {
        setErrorMsg(resData.message || "Failed to load spreadsheet data.");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to Apps Script. Check URL and CORS settings.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Update parent config settings
  const handleSaveSettings = () => {
    localStorage.setItem("raj_academy_script_url", scriptUrl);
    localStorage.setItem("raj_academy_teacher_pin", teacherPin);
    setShowSettingsModal(false);
    fetchStudents(scriptUrl);
  };

  // 4. Verification check for Teacher Pin
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === teacherPin) {
      setIsPinVerified(true);
      setPinError("");
    } else {
      setPinError("Invalid 4-digit security PIN.");
    }
  };

  const handleExitTeacherMode = () => {
    setIsPinVerified(false);
    setEnteredPin("");
    setCurrentView("dashboard");
  };

  // 5. Helper function to format WhatsApp templates
  const getWhatsAppDetails = (student: Student) => {
    const name = getValue(student, ["Student Name"]);
    const phone = getValue(student, ["Parent Phone"]);
    const date = getValue(student, ["Week Date"]) || inputDate;
    const attendance = getValue(student, ["Attendance"]);
    const marks = getValue(student, ["Math Test Marks"]);
    const maxMarks = getValue(student, ["Max Marks"]) || "20";
    const remarks = getValue(student, ["Teacher Remarks", "Teacher Remark"]);
    const studentClass = getValue(student, ["Class", "class"]);
    
    // Format class string
    const classLabel = studentClass ? ` (Class ${studentClass})` : "";
    
    // Parse percentage
    let pct = 0;
    try {
      pct = Math.round((parseFloat(marks) / parseFloat(maxMarks)) * 100);
    } catch (e) {
      pct = 0;
    }

    const isLowScorer = pct < 60;
    let messageBody = "";

    if (isLowScorer) {
      // Concerned template
      messageBody = 
        `Raj Academy — Urgent Update ⚠️\n\n` +
        `Dear Parent,\n\n` +
        `I am writing to share the math test report for *${name}*${classLabel} for the week ending *${date}*.\n\n` +
        `🔹 *Attendance*: ${attendance}\n` +
        `🔹 *Weekly Math Test*: ${marks} / ${maxMarks} (${pct}%)\n` +
        `🔹 *Teacher's Feedback*: "${remarks}"\n\n` +
        `Because the score is below our 60% threshold, we are concerned about their conceptual understanding of this topic. ` +
        `We suggest scheduling a brief Parent-Teacher Meeting (PTM) this week to discuss a remedial study plan. ` +
        `Please reply directly to this chat to coordinate a suitable time.\n\n` +
        `Taught by experience. Proven by results.`;
    } else {
      // Standard template
      messageBody = 
        `Raj Academy — Weekly Report 📊\n\n` +
        `Dear Parent,\n\n` +
        `Here is the academic progress report for *${name}*${classLabel} for the week ending *${date}*:\n\n` +
        `🔹 *Attendance*: ${attendance}\n` +
        `🔹 *Weekly Math Test*: ${marks} / ${maxMarks} (${pct}%)\n` +
        `🔹 *Teacher's Feedback*: "${remarks}"\n\n` +
        `Thank you for partnering with us to help your child excel.\n` +
        `If you have any questions, feel free to reply directly to this message.\n\n` +
        `Taught by experience. Proven by results.`;
    }

    const encodedText = encodeURIComponent(messageBody);
    return {
      phone,
      text: encodedText,
      url: `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
    };
  };

  // 6. Action: Send Single Report
  const triggerSingleSend = async (student: Student) => {
    const name = getValue(student, ["Student Name"]);
    const { url } = getWhatsAppDetails(student);
    window.open(url, "_blank");
    
    // Optimistic status update local
    setStudents(prev => 
      prev.map(st => getValue(st, ["Student Name"]) === name ? { ...st, Status: "Sent" } : st)
    );

    // Call API to write to Google Sheets
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updateStatus",
            updates: [{ name: name, status: "Sent" }]
          })
        });
      } catch (e) {
        console.error("Failed to update status in Google Sheet", e);
      }
    }
  };

  // 7. Action: Send All Pending (Initiates step-by-step Broadcast Wizard)
  const handleSendAllPending = () => {
    const pendingStudents = students.filter(st => {
      const studentBatch = getNormalizedBatch(getValue(st, ["Batch"]));
      const batchMatch = selectedBatchFilter === "All" || studentBatch === selectedBatchFilter;
      const status = getValue(st, ["Status"]);
      return batchMatch && status.toLowerCase() !== "sent";
    });

    if (pendingStudents.length === 0) {
      alert("No pending student reports in the selected batch filter.");
      return;
    }

    setBroadcastQueue(pendingStudents);
    setCurrentQueueIndex(0);
    setIsSendingBroadcast(true);
  };

  const handleSendCurrentWizard = async () => {
    if (currentQueueIndex < 0 || currentQueueIndex >= broadcastQueue.length) return;
    
    const student = broadcastQueue[currentQueueIndex];
    const name = getValue(student, ["Student Name"]);
    const { url } = getWhatsAppDetails(student);
    
    // 1. Open WhatsApp chat window
    window.open(url, "_blank");

    // 2. Optimistic UI update
    setStudents(prev => 
      prev.map(st => getValue(st, ["Student Name"]) === name ? { ...st, Status: "Sent" } : st)
    );

    // 3. Update status in Google Sheets in background
    if (scriptUrl) {
      setApiUpdatingStatus(true);
      try {
        await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updateStatus",
            updates: [{ name: name, status: "Sent" }]
          })
        });
      } catch (e) {
        console.error("Failed to update status in Google Sheet", e);
      } finally {
        setApiUpdatingStatus(false);
      }
    }

    // 4. Advance queue
    if (currentQueueIndex + 1 >= broadcastQueue.length) {
      setStatusMsg("🎉 All reports in queue processed!");
      setIsSendingBroadcast(false);
      setBroadcastQueue([]);
      setCurrentQueueIndex(-1);
      fetchStudents();
      setTimeout(() => setStatusMsg(""), 5000);
    } else {
      setCurrentQueueIndex(prev => prev + 1);
    }
  };

  const handleSkipCurrentWizard = () => {
    if (currentQueueIndex + 1 >= broadcastQueue.length) {
      setIsSendingBroadcast(false);
      setBroadcastQueue([]);
      setCurrentQueueIndex(-1);
      fetchStudents();
    } else {
      setCurrentQueueIndex(prev => prev + 1);
    }
  };

  // 8. Submit Unified Batch Attendance & Grades in 1 single API Call!
  // Action: Submit New Student Enrollment
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudentName.trim()) {
      alert("Please enter a student name.");
      return;
    }
    if (!newStudentPhone.trim()) {
      alert("Please enter a parent phone number.");
      return;
    }
    
    // Standard 10-digit check & prepend country code '91' for WhatsApp compatibility
    let cleanPhone = newStudentPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    } else if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setStudentAdding(true);
    setStatusMsg(`Adding student ${newStudentName}...`);

    try {
      if (scriptUrl) {
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "addStudent",
            student: {
              name: newStudentName.trim(),
              phone: cleanPhone,
              studentClass: newStudentClass.trim(),
              batch: newStudentBatch,
              maxMarks: 20,
              status: "Pending",
              date: inputDate // Use current Saturday date
            }
          })
        });
        const resData = await response.json();
        if (resData.status === "success") {
          setStatusMsg(`Successfully enrolled ${newStudentName}!`);
          // Clear inputs
          setNewStudentName("");
          setNewStudentPhone("");
          setNewStudentClass("");
          // Refresh list
          fetchStudents();
        } else {
          setErrorMsg(resData.message || "Failed to add student to Google Sheet.");
        }
      } else {
        setErrorMsg("Google Apps Script URL is not configured.");
      }
    } catch (err) {
      setErrorMsg("Network error adding student.");
    } finally {
      setStudentAdding(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // Action: Submit Daily Attendance logs
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const batchStudents = students.filter(st => {
      const studentBatch = getNormalizedBatch(getValue(st, ["Batch"]));
      return studentBatch === selectedBatchFilter;
    });

    if (batchStudents.length === 0) {
      alert("No students in this batch to log attendance.");
      return;
    }

    setAttendanceSubmitting(true);
    setStatusMsg("Saving daily attendance log to Google Sheet...");

    const updates = batchStudents.map(student => {
      const name = getValue(student, ["Student Name"]);
      const isPresent = attendanceChecklist[name] !== false; // Default true
      return {
        name,
        status: isPresent ? "Present" : "Absent",
        batch: selectedBatchFilter
      };
    });

    try {
      if (scriptUrl) {
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "submitAttendance",
            date: attendanceDate,
            updates
          })
        });
        const resData = await response.json();
        if (resData.status === "success") {
          setStatusMsg(`Attendance successfully logged for ${batchStudents.length} students!`);
          fetchStudents();
        } else {
          setErrorMsg(resData.message || "Failed to save daily attendance in Google Sheets.");
        }
      } else {
        // Local fallback
        setStudents(prev =>
          prev.map(st => {
            const name = getValue(st, ["Student Name"]);
            const match = updates.find(u => u.name === name);
            if (match) {
              const prevAtt = getValue(st, ["Attendance"]) || "0/0 Days";
              let att = 0, tot = 0;
              if (prevAtt.includes("/")) {
                const parts = prevAtt.split(" ")[0].split("/");
                att = parseInt(parts[0]) || 0;
                tot = parseInt(parts[1]) || 0;
              }
              if (match.status === "Present") att += 1;
              tot += 1;
              return { ...st, Attendance: `${att}/${tot} Days` };
            }
            return st;
          })
        );
        setStatusMsg("Attendance logged locally (No API URL configured).");
      }
    } catch (err) {
      setErrorMsg("Network error saving daily attendance.");
    } finally {
      setAttendanceSubmitting(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // 8. Submit Unified Batch Saturday Grades in 1 single API Call!
  const handleBatchSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter students to the currently selected filter batch
    const batchStudents = students.filter(st => {
      const studentBatch = getNormalizedBatch(getValue(st, ["Batch"]));
      const targetBatch = selectedBatchFilter === "All" ? studentBatch : selectedBatchFilter;
      return studentBatch === targetBatch;
    });

    if (batchStudents.length === 0) {
      alert("Please select a specific batch slot (e.g. 3pm) at the top of the page before submitting.");
      return;
    }

    setTeacherSubmitting(true);
    setStatusMsg("Saving weekly grades and remarks...");

    const updates = batchStudents.map(student => {
      const name = getValue(student, ["Student Name"]);
      const studentGrade = batchGrades[name] || { marks: "", remarks: "" };

      return {
        name,
        marks: studentGrade.marks,
        remarks: studentGrade.remarks,
        date: inputDate,
        status: "Pending" // Reset status to Pending for new report
      };
    });

    try {
      if (scriptUrl) {
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "submitBatchData",
            updates
          })
        });
        const resData = await response.json();
        if (resData.status === "success") {
          setStatusMsg(`Successfully saved attendance & grades for all ${batchStudents.length} students!`);
          fetchStudents();
        } else {
          setErrorMsg(resData.message || "Failed to update batch data in Google Sheets.");
        }
      } else {
        // Local fallback
        setStudents(prev =>
          prev.map(st => {
            const name = getValue(st, ["Student Name"]);
            const match = updates.find(u => u.name === name);
            return match ? {
              ...st,
              "Math Test Marks": match.marks,
              "Teacher Remarks": match.remarks,
              "Week Date": match.date,
              Status: match.status
            } : st;
          })
        );
        setStatusMsg("Batch data saved locally.");
      }
    } catch (err) {
      setErrorMsg("Network error saving batch session data.");
    } finally {
      setTeacherSubmitting(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // 10. Filtered list mapping
  const filteredStudents = students.filter(st => {
    if (selectedBatchFilter === "All") return true;
    const studentBatch = getNormalizedBatch(getValue(st, ["Batch"]));
    return studentBatch === selectedBatchFilter;
  });

  // Calculate statistics
  const totalStudentsCount = filteredStudents.length;
  let testAverage = 0;
  let attendanceRate = 0;
  
  if (totalStudentsCount > 0) {
    let scoreSum = 0;
    let possibleScoreSum = 0;
    let attendedSum = 0;
    let possibleAttendedSum = 0;

    filteredStudents.forEach(st => {
      try {
        const marks = parseFloat(getValue(st, ["Math Test Marks"]));
        const max = parseFloat(getValue(st, ["Max Marks"])) || 20;
        if (!isNaN(marks) && !isNaN(max)) {
          scoreSum += marks;
          possibleScoreSum += max;
        }
      } catch(e){}

      const attStr = getValue(st, ["Attendance"]);
      if (attStr && attStr.includes("/")) {
        try {
          const parts = attStr.split(" ")[0].split("/");
          const att = parseFloat(parts[0]);
          const tot = parseFloat(parts[1]);
          if (!isNaN(att) && !isNaN(tot)) {
            attendedSum += att;
            possibleAttendedSum += tot;
          }
        } catch(e){}
      } else if (attStr && !isNaN(parseFloat(attStr))) {
        try {
          const val = parseFloat(attStr);
          attendedSum += val;
          possibleAttendedSum += val;
        } catch(e){}
      }
    });

    testAverage = possibleScoreSum > 0 ? (scoreSum / possibleScoreSum) * 100 : 0;
    attendanceRate = possibleAttendedSum > 0 ? (attendedSum / possibleAttendedSum) * 100 : 0;
  }

  // Render main layout
  return (
    <div className={styles.container}>
      
      {/* HEADER SECTION */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Raj Academy <span>Portal</span></h1>
          <p>Student Results &amp; Communications Hub</p>
        </div>
        <div className={styles.navGroup}>
          {currentView === "dashboard" ? (
            <>
              <button 
                onClick={() => setCurrentView("teacher-input")} 
                className={`${styles.btn} ${styles.btnGold}`}
              >
                ✏️ Teacher Input
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)} 
                className={`${styles.btn} ${styles.btnOutline}`}
              >
                ⚙️ Config
              </button>
            </>
          ) : (
            <button onClick={handleExitTeacherMode} className={`${styles.btn} ${styles.btnOutline}`}>
              ← Back to Main
            </button>
          )}
        </div>
      </header>

      {/* FILTER & BATCH ACTION BAR (Shown at the top of both views) */}
      <div className={styles.filterBar} style={{ marginBottom: "20px" }}>
        <div className={styles.filterGroup}>
          {["All", "3pm", "4pm", "5pm", "6pm", "7pm"].map(batch => (
            <button
              key={batch}
              onClick={() => setSelectedBatchFilter(batch)}
              className={`${styles.filterBtn} ${selectedBatchFilter === batch ? styles.filterBtnActive : ""}`}
            >
              {batch === "All" ? "All Batches" : `${batch} Slot`}
            </button>
          ))}
        </div>
        {currentView === "dashboard" && (
          <div>
            <button 
              onClick={handleSendAllPending}
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ gap: "6px" }}
            >
              📨 Send All Pending
            </button>
          </div>
        )}
      </div>

      {/* NOTIFICATIONS & ERRORS */}
      {statusMsg && <div className={styles.alertBox} style={{ backgroundColor: "#D1FAE5", color: "#065F46", borderLeftColor: "#10B981" }}>{statusMsg}</div>}
      {errorMsg && <div className={styles.alertBox} style={{ backgroundColor: "#FEE2E2", color: "#991B1B", borderLeftColor: "#EF4444" }}>{errorMsg}</div>}

      {/* VIEW: TEACHER SECURE ENTRY DIALOG (BEFORE PIN VERIFICATION) */}
      {currentView === "teacher-input" && !isPinVerified && (
        <div className={styles.pinContainer}>
          <h2>Enter Security PIN</h2>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>Access restricted to instructors only</p>
          <form onSubmit={handlePinSubmit}>
            <input 
              type="password" 
              className={styles.pinInput} 
              maxLength={4} 
              value={enteredPin} 
              onChange={e => setEnteredPin(e.target.value)} 
              placeholder="••••"
              autoFocus
            />
            {pinError && <p style={{ color: "#EF4444", fontSize: "12px", margin: "5px 0" }}>{pinError}</p>}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Verify</button>
              <button type="button" onClick={() => setCurrentView("dashboard")} className={`${styles.btn} ${styles.btnOutline}`}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: UNIFIED BATCH LOGGER PANEL (AFTER VERIFICATION) */}
      {currentView === "teacher-input" && isPinVerified && (
        <div style={{ marginTop: "10px" }}>
          {selectedBatchFilter === "All" ? (
            <div className={styles.pinContainer} style={{ maxWidth: "500px", margin: "40px auto" }}>
              <h2>⚠️ Select a Batch Slot</h2>
              <p style={{ fontSize: "14px", color: "var(--muted)", margin: "10px 0 20px" }}>
                To record daily attendance and marks, please select a specific batch slot at the top (e.g., 3pm, 4pm, etc.).
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                {["3pm", "4pm", "5pm", "6pm", "7pm"].map(slot => (
                  <button 
                    key={slot} 
                    onClick={() => setSelectedBatchFilter(slot)} 
                    className={`${styles.btn} ${styles.btnOutline}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.formCard} style={{ maxWidth: "100%", overflow: "hidden" }}>
              {/* Tab Selector */}
              <div 
                style={{ 
                  display: "flex", 
                  gap: "10px", 
                  marginBottom: "20px", 
                  borderBottom: "2px solid var(--line)", 
                  paddingBottom: "10px",
                  flexWrap: "wrap"
                }}
              >
                <button
                  type="button"
                  onClick={() => setTeacherSubView("attendance")}
                  className={`${styles.filterBtn} ${teacherSubView === "attendance" ? styles.filterBtnActive : ""}`}
                  style={{ borderRadius: "8px", fontSize: "13px", padding: "8px 16px" }}
                >
                  📅 Daily Attendance
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherSubView("grades")}
                  className={`${styles.filterBtn} ${teacherSubView === "grades" ? styles.filterBtnActive : ""}`}
                  style={{ borderRadius: "8px", fontSize: "13px", padding: "8px 16px" }}
                >
                  📝 Saturday Grades
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherSubView("add-student")}
                  className={`${styles.filterBtn} ${teacherSubView === "add-student" ? styles.filterBtnActive : ""}`}
                  style={{ borderRadius: "8px", fontSize: "13px", padding: "8px 16px" }}
                >
                  ➕ Add Student
                </button>
              </div>

              {teacherSubView === "attendance" && (
                // VIEW: DAILY ATTENDANCE MANAGER
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid var(--line)", paddingBottom: "12px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h2 style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "2px" }}>
                        📅 Daily Attendance Manager — <span>{selectedBatchFilter} Slot</span>
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Mark Present or Absent for today's class.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)" }}>Class Date:</label>
                      <input 
                        type="date" 
                        className={styles.formControl} 
                        style={{ width: "160px", padding: "6px 10px" }}
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleAttendanceSubmit}>
                    <div className={styles.tableContainer} style={{ marginBottom: "24px" }}>
                      {filteredStudents.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                          No students are currently assigned to the **{selectedBatchFilter}** slot in your Google Sheet.
                        </div>
                      ) : (
                        <table style={{ minWidth: "600px" }}>
                          <thead>
                            <tr>
                              <th style={{ width: "40%" }}>Student Name</th>
                              <th style={{ width: "20%" }}>Class</th>
                              <th style={{ width: "20%", textAlign: "center" }}>Attendance Toggle</th>
                              <th style={{ width: "20%", textAlign: "center" }}>Weekly Summary (So Far)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map(student => {
                              const name = getValue(student, ["Student Name"]);
                              const studentClass = getValue(student, ["Class", "class"]);
                              const isPresent = attendanceChecklist[name] !== false;
                              const prevAtt = getValue(student, ["Attendance"]) || "0/0 Days";

                              return (
                                <tr key={name}>
                                  <td><strong>{name}</strong></td>
                                  <td>
                                    <span className={styles.badge} style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>
                                      Class {studentClass || "—"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <div className={styles.attendanceToggle} style={{ display: "inline-flex" }}>
                                      <button
                                        type="button"
                                        className={isPresent ? styles.presentActive : ""}
                                        onClick={() => setAttendanceChecklist(prev => ({ ...prev, [name]: true }))}
                                        style={{ padding: "8px 16px", fontSize: "13px" }}
                                      >
                                        Present
                                      </button>
                                      <button
                                        type="button"
                                        className={!isPresent ? styles.absentActive : ""}
                                        onClick={() => setAttendanceChecklist(prev => ({ ...prev, [name]: false }))}
                                        style={{ padding: "8px 16px", fontSize: "13px" }}
                                      >
                                        Absent
                                      </button>
                                    </div>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--charcoal)" }}>
                                      {prevAtt}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button 
                        type="button" 
                        onClick={handleExitTeacherMode} 
                        className={`${styles.btn} ${styles.btnOutline}`}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={attendanceSubmitting || filteredStudents.length === 0}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ minWidth: "200px" }}
                      >
                        {attendanceSubmitting ? "Saving Logs..." : `💾 Save Daily Attendance`}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {teacherSubView === "grades" && (
                // VIEW: SATURDAY GRADE LOGGER
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid var(--line)", paddingBottom: "12px", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h2 style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "2px" }}>
                        📝 Saturday Grade Logger — <span>{selectedBatchFilter} Slot</span>
                      </h2>
                      <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                        Enter weekly test scores and remarks.
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--charcoal)" }}>Session Date:</label>
                      <input 
                        type="date" 
                        className={styles.formControl} 
                        style={{ width: "160px", padding: "6px 10px" }}
                        value={inputDate}
                        onChange={e => setInputDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <form onSubmit={handleBatchSessionSubmit}>
                    <div className={styles.tableContainer} style={{ marginBottom: "24px" }}>
                      {filteredStudents.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                          No students are currently assigned to the **{selectedBatchFilter}** slot in your Google Sheet.
                        </div>
                      ) : (
                        <table style={{ minWidth: "750px" }}>
                          <thead>
                            <tr>
                              <th style={{ width: "20%" }}>Student Name</th>
                              <th style={{ width: "10%" }}>Class</th>
                              <th style={{ width: "15%", textAlign: "center" }}>Weekly Attendance</th>
                              <th style={{ width: "15%" }}>Score (out of 20)</th>
                              <th style={{ width: "40%" }}>Weekly Teacher Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredStudents.map(student => {
                              const name = getValue(student, ["Student Name"]);
                              const studentClass = getValue(student, ["Class", "class"]);
                              const prevAtt = getValue(student, ["Attendance"]) || "0/0 Days";
                              const currentData = batchGrades[name] || { marks: "", remarks: "" };

                              return (
                                <tr key={name}>
                                  <td><strong>{name}</strong></td>
                                  <td>
                                    <span className={styles.badge} style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>
                                      Class {studentClass || "—"}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "center" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--charcoal)" }}>
                                      {prevAtt}
                                    </span>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      min={0}
                                      max={20}
                                      placeholder="Marks"
                                      className={styles.formControl}
                                      style={{ padding: "6px" }}
                                      value={currentData.marks}
                                      onChange={e => setBatchGrades(prev => ({
                                        ...prev,
                                        [name]: { ...currentData, marks: e.target.value }
                                      }))}
                                    />
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                      <input
                                        type="text"
                                        placeholder="remarks..."
                                        className={styles.formControl}
                                        style={{ padding: "6px", flex: 1 }}
                                        value={currentData.remarks}
                                        onChange={e => setBatchGrades(prev => ({
                                          ...prev,
                                          [name]: { ...currentData, remarks: e.target.value }
                                        }))}
                                      />
                                      <select
                                        className={styles.presetSelect}
                                        style={{ 
                                          padding: "6px", 
                                          width: "110px", 
                                          fontSize: "12px", 
                                          borderRadius: "var(--border-radius)", 
                                          border: "1.5px solid var(--line)",
                                          backgroundColor: "#F8FAFC",
                                          cursor: "pointer"
                                        }}
                                        value=""
                                        onChange={e => {
                                          if (e.target.value) {
                                            setBatchGrades(prev => ({
                                              ...prev,
                                              [name]: { ...currentData, remarks: e.target.value }
                                            }));
                                          }
                                        }}
                                      >
                                        <option value="" disabled>⚡ Presets</option>
                                        {REMARK_PRESETS.map(preset => (
                                          <option key={preset} value={preset}>{preset}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                      <button 
                        type="button" 
                        onClick={handleExitTeacherMode} 
                        className={`${styles.btn} ${styles.btnOutline}`}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={teacherSubmitting || filteredStudents.length === 0}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ minWidth: "200px" }}
                      >
                        {teacherSubmitting ? "Saving Logs..." : `💾 Save Session Data (${selectedBatchFilter})`}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {teacherSubView === "add-student" && (
                // VIEW: ADD NEW STUDENT FORM
                <div>
                  <div style={{ borderBottom: "1.5px solid var(--line)", paddingBottom: "12px", marginBottom: "20px" }}>
                    <h2 style={{ borderBottom: "none", paddingBottom: 0, marginBottom: "2px" }}>
                      ➕ Add New Student Enrollment
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--muted)" }}>
                      Fill in the student details to add them to your Google Sheet database.
                    </p>
                  </div>

                  <form onSubmit={handleAddStudentSubmit} style={{ maxWidth: "600px" }}>
                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--charcoal)" }}>Student Name</label>
                      <input 
                        type="text" 
                        className={styles.formControl} 
                        value={newStudentName}
                        onChange={e => setNewStudentName(e.target.value)}
                        placeholder="Enter full name (e.g. Rahul Kumar)"
                        required
                      />
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: "16px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--charcoal)" }}>Parent Phone Number (10 Digits)</label>
                      <input 
                        type="tel" 
                        className={styles.formControl} 
                        value={newStudentPhone}
                        onChange={e => setNewStudentPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        required
                      />
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", margin: "4px 0 0" }}>
                        Enter the 10-digit mobile number. Country code `91` will be added automatically for WhatsApp reports.
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                      <div className={styles.formGroup}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--charcoal)" }}>Class Level</label>
                        <select 
                          className={styles.formControl} 
                          value={newStudentClass}
                          onChange={e => setNewStudentClass(e.target.value)}
                          required
                        >
                          <option value="">Select Class</option>
                          {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map(cls => (
                            <option key={cls} value={cls}>Class {cls}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "var(--charcoal)" }}>Batch Assignment</label>
                        <select 
                          className={styles.formControl} 
                          value={newStudentBatch}
                          onChange={e => setNewStudentBatch(e.target.value)}
                          required
                        >
                          {["3pm", "4pm", "5pm", "6pm", "7pm"].map(slot => (
                            <option key={slot} value={slot}>{slot} Slot</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                      <button 
                        type="button" 
                        onClick={() => setTeacherSubView("attendance")} 
                        className={`${styles.btn} ${styles.btnOutline}`}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={studentAdding}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        style={{ minWidth: "180px" }}
                      >
                        {studentAdding ? "Enrolling..." : "➕ Enroll Student"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: VISITOR / ADMIN DASHBOARD */}
      {currentView === "dashboard" && (
        <>
          {/* STATS SECTION */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Active Students ({selectedBatchFilter})</h3>
              <div className="value">{totalStudentsCount}</div>
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: "#3B82F6" }}>
              <h3>Math Test Average</h3>
              <div className="value">{testAverage.toFixed(1)}%</div>
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: "#10B981" }}>
              <h3>Weekly Attendance</h3>
              <div className="value">{attendanceRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* STUDENT DATA GRID */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2>Reports Database</h2>
              <button 
                onClick={() => fetchStudents()} 
                disabled={loading}
                className={styles.filterBtn}
                style={{ padding: "4px 10px" }}
              >
                {loading ? "Syncing..." : "🔄 Refresh"}
              </button>
            </div>
            <div className={styles.tableContainer}>
              {loading ? (
                <p style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading records from Google Sheets...</p>
              ) : filteredStudents.length === 0 ? (
                <p style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>No records found. Configure your Google Sheet script URL first.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Batch</th>
                      <th>Attendance</th>
                      <th>Test Score (20)</th>
                      <th>Teacher Feedback</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const name = getValue(student, ["Student Name"]);
                      const phone = getValue(student, ["Parent Phone"]);
                      const att = getValue(student, ["Attendance"]);
                      const marks = getValue(student, ["Math Test Marks"]);
                      const remarks = getValue(student, ["Teacher Remarks", "Teacher Remark"]);
                      const status = getValue(student, ["Status"]);
                      const batch = getValue(student, ["Batch"]);
                      const studentClass = getValue(student, ["Class", "class"]);

                      // Grade badge computation
                      let pct = 0;
                      try {
                        pct = Math.round((parseFloat(marks) / 20) * 100);
                      } catch(e){}

                      let badgeClass = styles.badgeWarning;
                      if (pct >= 90) badgeClass = styles.badgeSuccess;
                      else if (pct >= 60) badgeClass = styles.badgeInfo;

                      // Status style
                      let statusClass = styles.statusPending;
                      if (status.toLowerCase() === "sent") statusClass = styles.statusSent;
                      else if (status.toLowerCase() === "failed") statusClass = styles.statusFailed;

                      return (
                        <tr key={name}>
                          <td><strong>{name}</strong></td>
                          <td>
                            <span className={styles.badge} style={{ backgroundColor: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>
                              Class {studentClass || "—"}
                            </span>
                          </td>
                          <td><span className={styles.badge} style={{ backgroundColor: "#F1F5F9", color: "var(--charcoal)" }}>{getNormalizedBatch(batch)} Slot</span></td>
                          <td>{att || "0/0 Days"}</td>
                          <td>
                            <span className={`${styles.badge} ${badgeClass}`}>
                              {marks ? `${marks}/20 (${pct}%)` : "No Score"}
                            </span>
                          </td>
                          <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {remarks ? `"${remarks}"` : "—"}
                          </td>
                          <td>
                            <span className={`${styles.statusIndicator} ${statusClass}`}>
                              {status || "Pending"}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => triggerSingleSend(student)}
                              className={`${styles.btn} ${styles.btnWhatsapp}`}
                            >
                              Send WhatsApp
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL: SETTINGS & CONFIG */}
      {showSettingsModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Dashboard Configurations</h2>
              <button onClick={() => setShowSettingsModal(false)} className={styles.modalClose}>×</button>
            </div>
            
            <div className={styles.formGroup}>
              <label>Google Apps Script API URL</label>
              <input 
                type="text" 
                className={styles.formControl} 
                value={scriptUrl} 
                onChange={e => setScriptUrl(e.target.value)} 
                placeholder="https://script.google.com/macros/s/.../exec"
              />
              <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                Make sure you have deployed your script with access set to "Anyone".
              </p>
            </div>

            <div className={styles.formGroup}>
              <label>Teacher Access PIN (4 digits)</label>
              <input 
                type="text" 
                maxLength={4}
                className={styles.formControl} 
                value={teacherPin} 
                onChange={e => setTeacherPin(e.target.value)} 
                placeholder="1234"
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button onClick={handleSaveSettings} className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }}>
                Save Settings
              </button>
              <button onClick={() => setShowSettingsModal(false)} className={`${styles.btn} ${styles.btnOutline}`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP BROADCAST WIZARD */}
      {isSendingBroadcast && broadcastQueue.length > 0 && currentQueueIndex >= 0 && currentQueueIndex < broadcastQueue.length && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "550px", width: "95%" }}>
            <div className={styles.modalHeader}>
              <h2>WhatsApp Broadcast Queue</h2>
              <button 
                onClick={() => {
                  setIsSendingBroadcast(false);
                  setBroadcastQueue([]);
                  setCurrentQueueIndex(-1);
                  fetchStudents();
                }} 
                className={styles.modalClose}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              {/* Progress Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--muted)", marginBottom: "6px" }}>
                <span>Sending reports for: <strong>{selectedBatchFilter === "All" ? "All Batches" : `${selectedBatchFilter} Slot`}</strong></span>
                <span><strong>{currentQueueIndex + 1} of {broadcastQueue.length}</strong> students</span>
              </div>
              <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                <div 
                  style={{ 
                    width: `${((currentQueueIndex + 1) / broadcastQueue.length) * 100}%`, 
                    height: "100%", 
                    backgroundColor: "var(--gold)", 
                    transition: "width 0.3s ease" 
                  }} 
                />
              </div>
              
              {/* Student Report Card */}
              <div 
                style={{ 
                  backgroundColor: "#F8FAFC", 
                  border: "1px solid var(--line)", 
                  borderRadius: "var(--border-radius)", 
                  padding: "16px",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)", margin: 0 }}>
                      {getValue(broadcastQueue[currentQueueIndex], ["Student Name"])}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--muted)", margin: "2px 0 0" }}>
                      Class {getValue(broadcastQueue[currentQueueIndex], ["Class", "class"]) || "—"} · {getValue(broadcastQueue[currentQueueIndex], ["Batch"])} Slot
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span 
                      style={{ 
                        display: "inline-block",
                        backgroundColor: "#EFF6FF", 
                        color: "#1E40AF", 
                        padding: "4px 8px", 
                        borderRadius: "12px", 
                        fontSize: "12px", 
                        fontWeight: 700 
                      }}
                    >
                      📞 {getValue(broadcastQueue[currentQueueIndex], ["Parent Phone"])}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
                      Attendance
                    </span>
                    <strong style={{ fontSize: "14px", color: "var(--charcoal)" }}>
                      {getValue(broadcastQueue[currentQueueIndex], ["Attendance"]) || "0/0 Days"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block" }}>
                      Math Test Score
                    </span>
                    <strong style={{ fontSize: "14px", color: "var(--charcoal)" }}>
                      {getValue(broadcastQueue[currentQueueIndex], ["Math Test Marks"]) ? `${getValue(broadcastQueue[currentQueueIndex], ["Math Test Marks"])}/20` : "No Score"}
                    </strong>
                  </div>
                </div>
                
                <div>
                  <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                    Remarks & Feedback
                  </span>
                  <p style={{ fontSize: "13px", color: "var(--charcoal)", background: "white", padding: "8px 12px", borderRadius: "4px", border: "1px dashed var(--line)", margin: 0, fontStyle: "italic" }}>
                    "{getValue(broadcastQueue[currentQueueIndex], ["Teacher Remarks", "Teacher Remark"]) || "—"}"
                  </p>
                </div>
              </div>
              
              {/* Message Preview */}
              <div>
                <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  WhatsApp Message Preview
                </span>
                <div 
                  style={{ 
                    maxHeight: "150px", 
                    overflowY: "auto", 
                    fontSize: "12px", 
                    whiteSpace: "pre-wrap", 
                    backgroundColor: "#EFFFF4", 
                    border: "1.5px solid #25D366", 
                    borderRadius: "var(--border-radius)", 
                    padding: "12px",
                    color: "#0F5132",
                    fontFamily: "monospace"
                  }}
                >
                  {decodeURIComponent(getWhatsAppDetails(broadcastQueue[currentQueueIndex]).text)}
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button 
                onClick={handleSendCurrentWizard}
                className={`${styles.btn} ${styles.btnWhatsapp}`}
                style={{ flex: 2, padding: "12px", fontSize: "14px", gap: "6px" }}
                disabled={apiUpdatingStatus}
              >
                {apiUpdatingStatus ? "Syncing..." : "🟢 Send WhatsApp & Next"}
              </button>
              
              <button 
                onClick={handleSkipCurrentWizard}
                className={`${styles.btn} ${styles.btnOutline}`}
                style={{ flex: 1, padding: "12px" }}
                disabled={apiUpdatingStatus}
              >
                Skip
              </button>
              
              <button 
                onClick={() => {
                  setIsSendingBroadcast(false);
                  setBroadcastQueue([]);
                  setCurrentQueueIndex(-1);
                  fetchStudents();
                }}
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ flex: 1, padding: "12px" }}
                disabled={apiUpdatingStatus}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
