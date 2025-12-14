"use client";

import { useState, useEffect, useRef } from "react";
import { useOnboarding } from "./context/OnboardingContext";
import { AppInfoForm } from "./component/onboarding/AppInfoForm";
import { AppInfo } from "./types/onboarding";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ModernLanding.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const { completeOnboarding } = useOnboarding();
  const [showForm, setShowForm] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const handleGetStarted = () => setShowForm(true);

  const handleFormSubmit = async (data: AppInfo) => {
    await completeOnboarding(data);
    setShowForm(false);
  };

  useEffect(() => {
    if (showForm) return;

    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -80,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.from(subtitleRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: "power2.out",
      });

      gsap.from(featuresRef.current?.children || [], {
        y: 80,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
      });

      gsap.from(".timeline-step", {
        x: -100,
        opacity: 0,
        stagger: 0.3,
        scrollTrigger: {
          trigger: timelineRef.current,
          start: "top 75%",
        },
      });

      gsap.from(ctaRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [showForm]);

  if (showForm) {
    return (
      <div className="fullscreen dark-bg">
        <AppInfoForm onSubmit={handleFormSubmit} onBack={() => setShowForm(false)} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="landing-root fullscreen">
      <div ref={particlesRef} className="particles-layer" />

      {/* NAV */}
      <nav ref={navRef} className="nav">
        <div className="logo">Analyzer</div>
        <button className="primary-btn" onClick={handleGetStarted}>
          Get Analysis
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <h1 ref={titleRef}>
          Transform Your App <br />
          <span>With AI Insights</span>
        </h1>
        <p ref={subtitleRef}>
        Stop guessing. Get specific SaaS advice tailored to YOUR app.
        </p>
        <button className="primary-btn big" onClick={handleGetStarted}>
          Start Free →
        </button>
      </section>

      {/* FEATURES */}
      <section ref={featuresRef} className="features">
        {[
          ["Competitive Intelligence", "Learn what actually converts."],
          ["AI Personalization", "Insights tailored to your app."],
          ["Actionable Roadmap", "Clear steps, zero fluff."],
        ].map(([title, desc]) => (
          <div key={title} className="feature-card">
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </section>

      {/* TIMELINE */}
      <section ref={timelineRef} className="timeline">
        {[
          "Describe your app",
          "AI scans winning products",
          "Personalized insights",
          "Execution roadmap",
        ].map((step, i) => (
          <div key={i} className="timeline-step">
            <span>{i + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="cta">
        <h2>Ready to upgrade your product?</h2>
        <button className="primary-btn big" onClick={handleGetStarted}>
          Get My Free Analysis
        </button>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} Analyzer
      </footer>
    </div>
  );
}
