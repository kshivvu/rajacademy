"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "../app/page.module.css";

export default function TicketGenerator() {
  const [parentName, setParentName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("Class 10");
  const [school, setSchool] = useState("St. Michael's High School");
  const [customSchool, setCustomSchool] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate a random Ticket ID
  const generateTicketId = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RA-2026-${rand}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName || !whatsapp || !childName) {
      alert("Please fill in all required fields.");
      return;
    }
    const tid = generateTicketId();
    setTicketId(tid);
    setShowModal(true);
    setIsGenerated(true);
  };

  // Draw the ticket on the canvas
  useEffect(() => {
    if (showModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const logoImg = new window.Image();
      logoImg.src = "/logo.png";

      const drawTicket = () => {
        // Set canvas size (retina resolution)
        const scale = 2;
        canvas.width = 800 * scale;
        canvas.height = 400 * scale;
        ctx.scale(scale, scale);

        // Colors
        const navyDark = "#0A1D37";
        const navyLight = "#0F2A4A";
        const gold = "#C59B27";
        const cream = "#FAF6F0";

        // 1. Draw Navy Gradient Background
        const gradient = ctx.createLinearGradient(0, 0, 800, 0);
        gradient.addColorStop(0, navyDark);
        gradient.addColorStop(0.7, navyDark);
        gradient.addColorStop(0.701, navyLight);
        gradient.addColorStop(1, navyLight);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 400);

        // 2. Draw Outer Border (Gold)
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, 770, 370);

        ctx.strokeStyle = gold;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(19, 19, 762, 362);

        // 3. Draw Ticket Stub Cut-off Line (Dotted)
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(560, 15);
        ctx.lineTo(560, 385);
        ctx.strokeStyle = "rgba(197, 155, 39, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Decorative stub cut-out circles (top and bottom)
        ctx.fillStyle = cream;
        ctx.beginPath();
        ctx.arc(560, 15, 12, 0, Math.PI);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(560, 385, 12, Math.PI, 0);
        ctx.fill();

        // 4. Draw Header Content (Logo & Title)
        // Draw Logo Image (PNG)
        try {
          ctx.drawImage(logoImg, 40, 40, 60, 60);
        } catch (e) {
          // Fallback if image failed to draw
          ctx.strokeStyle = gold;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(40, 40, 60, 60);
        }

        // Branding Title
        ctx.fillStyle = cream;
        ctx.font = "800 24px 'Inter', sans-serif";
        ctx.fillText("RAJ ACADEMY", 115, 68);
        ctx.fillStyle = gold;
        ctx.font = "italic 13px 'Inter', sans-serif";
        ctx.fillText("Small Batches. Strong Foundations.", 115, 86);

        // Ticket Type Title
        ctx.fillStyle = gold;
        ctx.font = "bold 15px 'Inter', sans-serif";
        ctx.fillText("1-WEEK FREE TRIAL PASS", 115, 114);

        // 5. Draw Student & Class Details
        const detailsY = 160;
        const labelX = 60;
        const valueX = 210;

        const details = [
          { label: "STUDENT NAME", value: childName.toUpperCase() },
          { label: "GRADE / CLASS", value: childClass },
          { label: "SCHOOL", value: school === "Other" ? customSchool.toUpperCase() : school.toUpperCase() },
          { label: "TRIAL ACCESS", value: "FULL ACCESS FOR 1 WEEK" },
        ];

        details.forEach((item, index) => {
          const y = detailsY + index * 40;

          // Label
          ctx.fillStyle = "rgba(250, 246, 240, 0.5)";
          ctx.font = "500 11px 'Inter', sans-serif";
          ctx.fillText(item.label, labelX, y);

          // Value
          ctx.fillStyle = cream;
          ctx.font = "bold 15px 'Inter', sans-serif";
          ctx.fillText(item.value, valueX, y);

          // Underline
          if (index < details.length - 1) {
            ctx.strokeStyle = "rgba(197, 155, 39, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(labelX, y + 15);
            ctx.lineTo(520, y + 15);
            ctx.stroke();
          }
        });

        // 6. Draw Footer Info
        ctx.fillStyle = "rgba(250, 246, 240, 0.35)";
        ctx.font = "10px 'Inter', sans-serif";
        ctx.fillText("VALIDITY: TRIAL STARTS ON FIRST DEMO ATTENDANCE IN 2026", 60, 355);

        // 7. Draw Ticket Stub Details (Right Side)
        // Rotate for vertical text
        ctx.save();
        ctx.translate(595, 200);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = gold;
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText("ADMIT ONE STUDENT", -60, 0);
        ctx.restore();

        // Stub details (Vertical layout)
        ctx.fillStyle = cream;
        ctx.font = "bold 18px 'Inter', sans-serif";
        ctx.fillText("PASS ID", 610, 80);
        ctx.fillStyle = gold;
        ctx.font = "900 18px monospace";
        ctx.fillText(ticketId, 610, 105);

        // Stylized Barcode
        const barcodeX = 610;
        const barcodeY = 145;
        const barcodeHeight = 65;
        ctx.fillStyle = cream;
        for (let i = 0; i < 110; i += 3) {
          // Generate pseudo-random barcode lines
          const lineW = (i % 7 === 0 || i % 11 === 0) ? 2.5 : 1;
          ctx.fillRect(barcodeX + i, barcodeY, lineW, barcodeHeight);
        }

        ctx.fillStyle = "rgba(250, 246, 240, 0.6)";
        ctx.font = "10px monospace";
        ctx.fillText("* TRIAL ACCESS *", 620, 232);

        // Contact details on stub
        ctx.fillStyle = cream;
        ctx.font = "bold 11px 'Inter', sans-serif";
        ctx.fillText("PHONE: 9199796653", 610, 280);
        ctx.fillStyle = "rgba(250, 246, 240, 0.6)";
        ctx.font = "9px 'Inter', sans-serif";
        ctx.fillText("KURJI, VIKAS NAGAR, PATNA", 610, 300);

        // 8. Seal of Authenticity (Circle graphic in background)
        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(380, 200, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      logoImg.onload = drawTicket;
      if (logoImg.complete) {
        drawTicket();
      }
    }
  }, [showModal, childName, childClass, school, customSchool, ticketId]);

  // Handle image download
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `Raj_Academy_Demo_Pass_${childName.replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // Construct WhatsApp Link
  const getWhatsAppLink = () => {
    const text = `Hi, I have registered my child *${childName}* (${childClass}) for the 1-Week Free Demo Class at Raj Academy. Here is our Pass ID: *${ticketId}*.\n\nParent Name: ${parentName}\nSchool: ${school === "Other" ? customSchool : school}\n\nPlease book our seat!`;
    return `https://wa.me/919199796653?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className={styles.bookingContainer}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>Reserve a 1-Week Free Demo Class</h3>
          <p className={styles.formSubtitle}>
            Experience our premium, small-batch (max 15) mentoring classes. No payment required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.bookingForm}>
          <div className={styles.formGroup}>
            <label htmlFor="childName">Student's Full Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              id="childName"
              placeholder="Enter student's name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="childClass">Grade / Class <span className={styles.required}>*</span></label>
              <select
                id="childClass"
                value={childClass}
                onChange={(e) => setChildClass(e.target.value)}
              >
                <option value="Class 4">Class 4 (Math & Science)</option>
                <option value="Class 5">Class 5 (Math & Science)</option>
                <option value="Class 6">Class 6 (Math & Science)</option>
                <option value="Class 7">Class 7 (Math & Science)</option>
                <option value="Class 8">Class 8 (Math & Science)</option>
                <option value="Class 9">Class 9 (Math & Science)</option>
                <option value="Class 10">Class 10 (Math & Science)</option>
                <option value="Class 11">Class 11 (Mathematics)</option>
                <option value="Class 12">Class 12 (Mathematics)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="school">School <span className={styles.required}>*</span></label>
              <select
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                <option value="St. Michael's High School">St. Michael's High School</option>
                <option value="Loyola High School">Loyola High School</option>
                <option value="Notre Dame Academy">Notre Dame Academy</option>
                <option value="Other">Other School</option>
              </select>
            </div>
          </div>

          {school === "Other" && (
            <div className={styles.formGroup}>
              <label htmlFor="customSchool">School Name <span className={styles.required}>*</span></label>
              <input
                type="text"
                id="customSchool"
                placeholder="Enter school name"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="parentName">Parent's Name <span className={styles.required}>*</span></label>
            <input
              type="text"
              id="parentName"
              placeholder="Enter parent or guardian name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="whatsapp">Parent's WhatsApp Number <span className={styles.required}>*</span></label>
            <input
              type="tel"
              id="whatsapp"
              placeholder="e.g., 9876543210"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Generate Free 1-Week Trial Pass
          </button>
        </form>
      </div>

      {/* Ticket Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button
              onClick={() => setShowModal(false)}
              className={styles.closeModalBtn}
              aria-label="Close modal"
            >
              &times;
            </button>
            
            <div className={styles.modalHeader}>
              <span className={styles.successBadge}>✓ Registration Confirmed</span>
              <h3 className={styles.modalTitle}>Your Admission Pass is Ready!</h3>
              <p className={styles.modalSubtitle}>
                Download your pass and share it with Shivam on WhatsApp to confirm your slot in the upcoming batch.
              </p>
            </div>

            <div className={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            <div className={styles.modalActions}>
              <button onClick={handleDownload} className={styles.downloadBtn}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Save Pass as Image
              </button>
              
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.whatsappBtn}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ marginRight: "8px" }}
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.688 2.008 14.195.979 11.996.979 6.558.979 2.13 5.348 2.126 10.776c-.001 1.705.452 3.36 1.31 4.814L2.44 21.058l5.8-1.52c.026.015.05.029.076.044z" />
                </svg>
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
