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
}

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

  // Teacher Input Mode - Selection & Submission
  const [teacherSelectedName, setTeacherSelectedName] = useState("");
  const [teacherScore, setTeacherScore] = useState("15");
  const [teacherRemarks, setTeacherRemarks] = useState("");
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [inputDate, setInputDate] = useState("");

  // Attendance Checklist state: { [studentName]: boolean }
  const [attendanceChecklist, setAttendanceChecklist] = useState<Record<string, boolean>>({});

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
      
      const today = new Date().toISOString().split("T")[0];
      setInputDate(today);
      
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
        
        // Initialize attendance checklist with all present (true)
        const initialAttendance: Record<string, boolean> = {};
        resData.data.forEach((st: Student) => {
          const name = getValue(st, ["Student Name"]);
          if (name) {
            initialAttendance[name] = true;
          }
        });
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
    setTeacherSelectedName("");
    setTeacherRemarks("");
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
        `I am writing to share the math test report for *${name}* for the week ending *${date}*.\n\n` +
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
        `Here is the academic progress report for *${name}* for the week ending *${date}*:\n\n` +
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

  // 7. Action: Send All Pending sequentially
  const handleSendAllPending = async () => {
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

    const confirmSend = confirm(
      `This will open WhatsApp tabs for ${pendingStudents.length} students sequentially with a 2-second delay. Please ensure your browser allows popups.`
    );
    if (!confirmSend) return;

    setStatusMsg("Triggering broadcasts...");

    // Loop through with 2s delay
    for (let i = 0; i < pendingStudents.length; i++) {
      const student = pendingStudents[i];
      const { url } = getWhatsAppDetails(student);
      
      // Delay wrapper
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          window.open(url, "_blank");
          resolve();
        }, i === 0 ? 0 : 2000);
      });
    }

    // Call API to bulk update status to "Sent"
    if (scriptUrl) {
      try {
        setStatusMsg("Updating statuses in Google Sheets...");
        const updates = pendingStudents.map(st => ({ name: getValue(st, ["Student Name"]), status: "Sent" }));
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "updateStatus",
            updates
          })
        });
        const result = await response.json();
        
        if (result.status === "success") {
          setStatusMsg("All pending reports opened and marked as Sent!");
          fetchStudents();
        } else {
          setErrorMsg("Failed to update status column in Sheets.");
        }
      } catch (err) {
        setErrorMsg("Network error updating sheet status.");
      }
    } else {
      // Local fallback only
      setStudents(prev =>
        prev.map(st => {
          const name = getValue(st, ["Student Name"]);
          const isPending = pendingStudents.some(p => getValue(p, ["Student Name"]) === name);
          return isPending ? { ...st, Status: "Sent" } : st;
        })
      );
      setStatusMsg("Sent locally (No script API configured).");
    }

    setTimeout(() => setStatusMsg(""), 5000);
  };

  // 8. Submit grades from Teacher View
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherSelectedName) {
      alert("Please select a student.");
      return;
    }

    setTeacherSubmitting(true);
    setStatusMsg("Saving grades...");
    
    try {
      const payload = {
        action: "submitGrades",
        studentName: teacherSelectedName,
        marks: teacherScore,
        remarks: teacherRemarks,
        date: inputDate,
        status: "Pending" // Reset to pending when new marks are added
      };

      if (scriptUrl) {
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        if (resData.status === "success") {
          setStatusMsg(`Saved grades for ${teacherSelectedName}!`);
          setTeacherRemarks("");
          setTeacherSelectedName("");
          fetchStudents();
        } else {
          setErrorMsg(resData.message || "Failed to submit grades to sheet.");
        }
      } else {
        // Local fallback
        setStudents(prev => 
          prev.map(st => getValue(st, ["Student Name"]) === teacherSelectedName ? {
            ...st,
            "Math Test Marks": teacherScore,
            "Teacher Remarks": teacherRemarks,
            "Week Date": inputDate,
            "Status": "Pending"
          } : st)
        );
        setStatusMsg("Saved locally (No script URL configured).");
      }
    } catch (err) {
      setErrorMsg("Failed to connect to Google Apps Script API.");
    } finally {
      setTeacherSubmitting(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // 9. Submit attendance checklist in bulk for a batch
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter students to the currently selected filter batch (or slot time)
    const batchStudents = students.filter(st => {
      const studentBatch = getNormalizedBatch(getValue(st, ["Batch"]));
      const targetBatch = selectedBatchFilter === "All" ? studentBatch : selectedBatchFilter;
      return studentBatch === targetBatch;
    });

    if (batchStudents.length === 0) {
      alert("Please select a specific batch time (e.g. 3pm) to submit attendance checklist.");
      return;
    }

    setTeacherSubmitting(true);
    setStatusMsg("Saving attendance updates...");

    const updates = batchStudents.map(student => {
      const name = getValue(student, ["Student Name"]);
      const isPresent = attendanceChecklist[name] !== false; // Default true
      
      const attendanceStr = getValue(student, ["Attendance"]) || "0/0 Days";
      let attended = 0;
      let total = 0;

      if (attendanceStr.includes("/")) {
        try {
          const parts = attendanceStr.split(" ")[0].split("/");
          attended = parseInt(parts[0]) || 0;
          total = parseInt(parts[1]) || 0;
        } catch (e) {}
      } else if (attendanceStr !== "") {
        // Fallback if it is a raw number (e.g. '5')
        try {
          attended = parseInt(attendanceStr) || 0;
          total = attended; // Assume current total equals current attended, then increment
        } catch(e) {}
      }

      if (isPresent) {
        attended += 1;
      }
      total += 1;

      return {
        name,
        attendance: `${attended}/${total} Days`
      };
    });

    try {
      if (scriptUrl) {
        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify({
            action: "submitAttendance",
            updates
          })
        });
        const resData = await response.json();
        if (resData.status === "success") {
          setStatusMsg("Attendance checklist updated successfully!");
          fetchStudents();
        } else {
          setErrorMsg(resData.message || "Failed to update attendance checklist.");
        }
      } else {
        // Local fallback
        setStudents(prev =>
          prev.map(st => {
            const name = getValue(st, ["Student Name"]);
            const match = updates.find(u => u.name === name);
            return match ? { ...st, Attendance: match.attendance } : st;
          })
        );
        setStatusMsg("Attendance updated locally.");
      }
    } catch (err) {
      setErrorMsg("Network error updating attendance in Google Sheet.");
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
        // Fallback for raw numbers
        try {
          const val = parseFloat(attStr);
          attendedSum += val;
          possibleAttendedSum += val; // Assume out of same
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

      {/* NOTIFICATIONS & ERRORS */}
      {statusMsg && <div className={styles.alertBox} style={{ backgroundColor: "#D1FAE5", color: "#065F46", borderLeftColor: "#10B981" }}>{statusMsg}</div>}
      {errorMsg && <div className={styles.alertBox} style={{ backgroundColor: "#FEE2E2", color: "#991B1B", borderLeftColor: "#EF4444" }}>{errorMsg}</div>}

      {/* VIEW: TEACHER SECURE ENTRY DIALOG (BEFORE VERIFICATION) */}
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

      {/* VIEW: TEACHER INPUT PANEL (AFTER VERIFICATION) */}
      {currentView === "teacher-input" && isPinVerified && (
        <div className={styles.teacherGrid}>
          
          {/* Card A: Submit Test Score */}
          <div className={styles.formCard}>
            <h2>Submit Weekly Grade</h2>
            <form onSubmit={handleGradeSubmit}>
              
              <div className={styles.formGroup}>
                <label>Select Student</label>
                <select 
                  className={styles.formControl}
                  value={teacherSelectedName}
                  onChange={e => {
                    const st = students.find(s => getValue(s, ["Student Name"]) === e.target.value);
                    setTeacherSelectedName(e.target.value);
                    if (st) {
                      setTeacherScore(getValue(st, ["Math Test Marks"]) || "15");
                      setTeacherRemarks(getValue(st, ["Teacher Remarks", "Teacher Remark"]) || "");
                    }
                  }}
                >
                  <option value="">-- Choose Student --</option>
                  {filteredStudents.map(s => {
                    const name = getValue(s, ["Student Name"]);
                    const batch = getValue(s, ["Batch"]);
                    return (
                      <option key={name} value={name}>
                        {name} ({getNormalizedBatch(batch)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Math Test Score (out of 20)</label>
                <input 
                  type="number" 
                  min={0} 
                  max={20} 
                  className={styles.formControl}
                  value={teacherScore}
                  onChange={e => setTeacherScore(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Week Date</label>
                <input 
                  type="date" 
                  className={styles.formControl} 
                  value={inputDate}
                  onChange={e => setInputDate(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Teacher Remarks &amp; Feedback</label>
                <textarea 
                  rows={4}
                  className={styles.formControl}
                  value={teacherRemarks}
                  onChange={e => setTeacherRemarks(e.target.value)}
                  placeholder="e.g. Excellent grasp of concepts, showing good progress."
                />
              </div>

              <button 
                type="submit" 
                disabled={teacherSubmitting}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ width: "100%" }}
              >
                {teacherSubmitting ? "Saving..." : "Submit Student Grade"}
              </button>
            </form>
          </div>

          {/* Card B: Batch Daily Attendance checklist */}
          <div className={styles.formCard}>
            <h2>Mark Daily Attendance</h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "15px" }}>
              Update attendance records for the selected batch slot: <strong>{selectedBatchFilter}</strong>
            </p>
            
            {selectedBatchFilter === "All" ? (
              <div className={styles.alertBox} style={{ fontSize: "12px", padding: "10px" }}>
                ⚠️ Please select a specific batch filter time (e.g. 3pm, 4pm) at the top of the dashboard to mark daily attendance.
              </div>
            ) : (
              <form onSubmit={handleAttendanceSubmit}>
                <div className={styles.attendanceList}>
                  {filteredStudents.length === 0 ? (
                    <p style={{ padding: "15px", textAlign: "center", color: "var(--muted)" }}>No students in this batch.</p>
                  ) : (
                    filteredStudents.map(student => {
                      const name = getValue(student, ["Student Name"]);
                      const isPresent = attendanceChecklist[name] !== false; // default true
                      
                      return (
                        <div key={name} className={styles.attendanceItem}>
                          <strong>{name}</strong>
                          <div className={styles.attendanceToggle}>
                            <button
                              type="button"
                              className={isPresent ? styles.presentActive : ""}
                              onClick={() => setAttendanceChecklist(prev => ({ ...prev, [name]: true }))}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={!isPresent ? styles.absentActive : ""}
                              onClick={() => setAttendanceChecklist(prev => ({ ...prev, [name]: false }))}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={teacherSubmitting || filteredStudents.length === 0}
                  className={`${styles.btn} ${styles.btnGold}`}
                  style={{ width: "100%" }}
                >
                  {teacherSubmitting ? "Updating..." : `Submit Daily Attendance (${selectedBatchFilter})`}
                </button>
              </form>
            )}
          </div>

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

          {/* FILTER & BATCH ACTION BAR */}
          <div className={styles.filterBar}>
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
            <div>
              <button 
                onClick={handleSendAllPending}
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ gap: "6px" }}
              >
                📨 Send All Pending
              </button>
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

    </div>
  );
}
