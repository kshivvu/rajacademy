"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import TicketGenerator from "../components/TicketGenerator";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  
  // Simulated seats
  const [boardSeats] = useState(2);
  const [seniorSeats] = useState(3);
  const [juniorSeats] = useState(4);
  const [highSchoolSeats] = useState(3);

  // Scroll handler for header shrink
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles.page}>
      {/* 1. Classic Academic Header */}
      <header className={`${styles.siteHeader} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.navShell}>
          <div className={styles.brand} onClick={() => scrollToSection("hero")}>
            <Image
              src="/logo.png"
              alt="Raj Academy Monogram logo"
              width={70}
              height={70}
              className={styles.brandImg}
              priority
            />
            <div className={styles.brandText}>
              <b>RAJ ACADEMY</b>
              <small>Small Batches · Strong Foundations</small>
            </div>
          </div>
          
          <nav className={styles.mainNav}>
            <a onClick={() => scrollToSection("story")}>Our Story</a>
            <a onClick={() => scrollToSection("why-batches")}>Why Small Batches</a>
            <a onClick={() => scrollToSection("ledger")}>Academic Ledger</a>
            <a onClick={() => scrollToSection("demo")}>Free Trial</a>
            <a onClick={() => scrollToSection("contact")}>Contact</a>
            <button className={styles.navCta} onClick={() => scrollToSection("demo")}>
              Apply for Trial <span>→</span>
            </button>
          </nav>
        </div>
      </header>

      <main>
        {/* 2. Hero Section */}
        <section id="hero" className={styles.hero}>
          <Image 
            src="/hero_math_concept.png" 
            alt="Mathematics teaching visual background" 
            fill 
            className={styles.heroImage} 
            priority 
          />
          <div className={styles.heroShade}></div>
          
          <div className={`${styles.heroContent} shell`}>
            <p className={styles.heroKicker}>
              <span></span> Capped at 15 students per batch
            </p>
            <h1>
              Where Every<br />
              <em>Student Gets</em><br />
              Noticed
            </h1>
            <p className={styles.heroIntro}>
              A premium offline mathematics and science academy in Patna. We reject crowded coaching classrooms to focus on individual logic, high-accountability mentoring, and conceptual depth.
            </p>
            <div className={styles.heroActions}>
              <button onClick={() => scrollToSection("demo")} className="button gold">
                Book 1-Week Trial <span>→</span>
              </button>
              <button onClick={() => scrollToSection("ledger")} className="button outline">
                Academic Ledger
              </button>
            </div>
          </div>
          
          <div className={styles.heroBottom}>
            <div className="shell">
              <span>Max 15 per class</span>
              <span>Daily Practice Sheets</span>
              <span>Weekly Assessments</span>
              <span>Kurji, Patna</span>
            </div>
          </div>
        </section>

        {/* 3. Stats Band */}
        <section className={styles.stats}>
          <div className={`shell ${styles.statsGrid}`}>
            <div>
              <strong>96%</strong>
              <span>Top Board Score</span>
            </div>
            <div>
              <strong>15</strong>
              <span>Max Batch Limit</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Concept Clarity</span>
            </div>
            <div>
              <strong>CBSE / ICSE</strong>
              <span>Patna Boards Prep</span>
            </div>
          </div>
        </section>

        {/* 4. Brand Story Section */}
        <section id="story" className={styles.aboutSection}>
          <div className={`shell ${styles.aboutGrid}`}>
            <div className={styles.aboutPhoto}>
              <Image 
                src="/father_teaching_math.png" 
                alt="Bespoke Math coaching legacy" 
                fill 
                sizes="(max-width: 800px) 100vw, 50vw" 
              />
            </div>
            
            <div className={styles.aboutCopy}>
              <p className={styles.eyebrow}>Our Foundation</p>
              <h2>A partnership of <em>excellence.</em></h2>
              
              <blockquote className={styles.quoteBlock}>
                "My father taught me math for years. I scored 96% in my Class 10 board exams. Now, he is teaching your child."
              </blockquote>
              
              <p>
                Raj Academy was established to transition a personal history of top academic scores into a rigorous, individualised tutoring method. Our founder was mentored directly by his father, a veteran mathematician, to master the logical fundamentals of CBSE/ICSE boards.
              </p>
              <p>
                Today, father and son run Raj Academy as a dedicated partnership, bringing this exact elite, high-accountability mentoring to missionary school students in Patna. We do not hire generic tutors—your child learns directly from us.
              </p>
              <p className={styles.signature}>
                The Father & Son Partnership
                <small>Instructors, Raj Academy</small>
              </p>
            </div>
          </div>
        </section>

        {/* 5. Why Choose Us Section */}
        <section id="why-batches" className={`${styles.why} shell section`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The Raj Academy Difference</p>
            <h2>An education built<br />on <em>focus and mastery.</em></h2>
          </div>
          
          <div className={styles.whyGrid}>
            <article>
              <b>01</b>
              <strong>96% Board Score</strong>
              <h3>Verified Success</h3>
              <p>The founder scored 96% in Class 10 board exams through the same logical curriculum we pass on today.</p>
            </article>
            <article>
              <b>02</b>
              <strong>Max 15 Batch</strong>
              <h3>Individual Focus</h3>
              <p>Strictly capped batches guarantee the teacher has time to check every student's work and answer every question.</p>
            </article>
            <article>
              <b>03</b>
              <strong>Daily Worksheets</strong>
              <h3>Structured Daily Practice</h3>
              <p>Every student receives a custom printed Daily Practice Sheet (DPS) to reinforce logic at home step-by-step.</p>
            </article>
            <article>
              <b>04</b>
              <strong>Weekly Updates</strong>
              <h3>High Accountability</h3>
              <p>Attendance records and assessment sheets are shared directly with parents via WhatsApp every single week.</p>
            </article>
          </div>
        </section>

        {/* 6. Academic Ledger Section */}
        <section id="ledger" className={styles.ledgerSection}>
          <div className="shell">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Enrollment Details</p>
              <h2>The Academic <em>Ledger.</em></h2>
            </div>
            
            <div className={styles.ledgerGrid}>
              <div>
                <p className={styles.promoDescription} style={{ fontSize: "16px", lineHeight: "1.8" }}>
                  We keep our operations transparent and focused. Review our structured courses, curriculum limits, monthly fees, and current seat vacancies. Admissions are subject to strict availability and class limits.
                </p>
              </div>
              
              <div>
                {/* Card 1: Junior Batch */}
                <div className={styles.ledgerCard}>
                  <small>Classes 4 – 6</small>
                  <h3>Junior Batch</h3>
                  <p>Integrated Mathematics & Basic Science. Focuses on building arithmetic foundations, logic building blocks, and custom Daily Practice Sheets (DPS).</p>
                  <span className={styles.feeSpan}>Monthly Fee: ₹1,500 · {juniorSeats} Seats Left</span>
                  <b>01</b>
                </div>

                {/* Card 2: Senior Batch */}
                <div className={styles.ledgerCard}>
                  <small>Classes 7 – 9</small>
                  <h3>Senior Batch</h3>
                  <p>CBSE & ICSE Math and Science syllabus. Focuses on calculation accuracy, speed, timed regular tests, and parent progress reporting.</p>
                  <span className={styles.feeSpan}>Monthly Fee: ₹2,000 · {seniorSeats} Seats Left</span>
                  <b>02</b>
                </div>

                {/* Card 3: Board Batch */}
                <div className={styles.ledgerCard}>
                  <small>Class 10</small>
                  <h3>Board Batch</h3>
                  <p>Rigorous NCERT focus & past 10 years Board question papers. Includes simulated mock exams and board paper writing guidance.</p>
                  <span className={styles.feeSpan}>Monthly Fee: ₹3,000 · {boardSeats} Seats Left</span>
                  <b>03</b>
                </div>

                {/* Card 4: High School Batch */}
                <div className={styles.ledgerCard}>
                  <small>Classes 11 – 12</small>
                  <h3>High School</h3>
                  <p>Pure Mathematics (Calculus, Coordinate Geometry, Algebra). Formulates advanced board preparation alongside IIT-JEE foundations.</p>
                  <span className={styles.feeSpan}>Monthly Fee: ₹3,000 · {highSchoolSeats} Seats Left</span>
                  <b>04</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Registration Block */}
        <section id="demo" className={styles.noticeSection}>
          <div className={`shell ${styles.noticeGrid}`}>
            <div className={styles.noticePromo}>
              <p className={styles.eyebrow}>Try Before Enrolling</p>
              <div className={styles.promoHeading}>
                <h2>1-Week Free Trial <em>Admission.</em></h2>
              </div>
              <p className={styles.promoDescription}>
                We invite parents to witness our capped-batch classrooms firsthand. Register below to generate your admission trial pass, giving your child full access to lectures, printed practice sheets, and a logic gap assessment.
              </p>
              
              <ul className={styles.promoList}>
                <li><strong>Full Course Access:</strong> Participate in all lectures scheduled for your class for a full week.</li>
                <li><strong>Printed Homework Worksheets:</strong> Solve our custom Daily Practice Sheets and receive corrections.</li>
                <li><strong>Performance Diagnostic:</strong> Receive a detailed feedback report outlining strengths and gaps.</li>
              </ul>
            </div>

            <TicketGenerator />
          </div>
        </section>
      </main>

      {/* 8. Traditional Footer Section */}
      <footer id="contact" className={styles.siteFooter}>
        <div className={`shell ${styles.footerMain}`}>
          <div className={styles.footerBrand}>
            <div>
              <h3>RAJ ACADEMY</h3>
              <p>
                Providing top-tier educational support with max 15-student groups to ensure every student in Patna achieves academic mastery.
              </p>
            </div>
          </div>
          
          <div className={styles.footerLinks}>
            <h4>Quick Links</h4>
            <a onClick={() => scrollToSection("hero")}>Home</a>
            <a onClick={() => scrollToSection("story")}>Our Story</a>
            <a onClick={() => scrollToSection("why-batches")}>Why Small Batches</a>
            <a onClick={() => scrollToSection("ledger")}>Academic Ledger</a>
            <a onClick={() => scrollToSection("demo")}>Book Free Trial</a>
          </div>
          
          <div className={styles.footerContactBlock}>
            <h4>Academy Location</h4>
            <p className={styles.footerContactText}>
              📍 Kurji, Vikas Nagar, near Holy Family Hospital, Patna, Bihar 800010
            </p>
            <p className={styles.footerContactText}>
              📞 Phone: 9199796653
            </p>
            
            <div className={styles.mapFrame}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3597.2343886566415!2d85.10142857597143!3d25.630327313885695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed582046db27bf%3A0xd6ca0096996d99b2!2sVikas%20Nagar%2C%20Patna%2C%20Bihar%20800010!5e0!3m2!1sen!2sin!4v1718536800000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
        
        <div className={`shell ${styles.footerBottom}`}>
          <p>&copy; {new Date().getFullYear()} Raj Academy. All rights reserved.</p>
          <p>Designed for absolute results and conceptual depth in Patna. <a href="https://wa.me/919199796653" target="_blank" rel="noopener noreferrer">Contact Admin</a></p>
        </div>
      </footer>

      {/* 9. Floating WhatsApp Widget */}
      <a
        href="https://wa.me/919199796653?text=Hi,%20I'm%20interested%20in%20enquiring%20about%20Raj%20Academy%20tuitions."
        target="_blank"
        rel="noopener noreferrer"
        className={styles.floatingWhatsapp}
        aria-label="Contact on WhatsApp"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.688 2.008 14.195.979 11.996.979 6.558.979 2.13 5.348 2.126 10.776c-.001 1.705.452 3.36 1.31 4.814L2.44 21.058l5.8-1.52c.026.015.05.029.076.044z" />
        </svg>
      </a>
    </div>
  );
}
