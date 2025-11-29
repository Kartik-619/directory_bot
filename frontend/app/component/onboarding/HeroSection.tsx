"use client";

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './Hero.css';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation
      if (logoRef.current) {
        gsap.fromTo(logoRef.current, 
          { 
            scale: 0,
            rotation: -180,
            opacity: 0
          },
          { 
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 1,
            ease: "back.out(1.7)"
          }
        );
      }

      // Title animation
      if (titleRef.current) {
        gsap.fromTo(titleRef.current,
          { 
            y: 100,
            opacity: 0,
            scale: 1.2
          },
          { 
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            delay: 0.3
          }
        );
      }

      // Subtitle animation
      if (subtitleRef.current) {
        gsap.fromTo(subtitleRef.current,
          {
            y: 50,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            delay: 0.8
          }
        );
      }

      // Features animation
      if (featuresRef.current && featuresRef.current.children) {
        gsap.fromTo(featuresRef.current.children,
          {
            y: 60,
            opacity: 0,
            scale: 0.8
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.4)",
            delay: 1.2
          }
        );
      }

      // Button animation
      if (buttonRef.current) {
        gsap.fromTo(buttonRef.current,
          {
            y: 30,
            opacity: 0,
            scale: 0.9
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "elastic.out(1, 0.8)",
            delay: 1.8
          }
        );
      }

      // Trust indicators animation
      if (trustRef.current && trustRef.current.children) {
        gsap.fromTo(trustRef.current.children,
          {
            y: 20,
            opacity: 0
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            delay: 2.2
          }
        );
      }

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="hero-section">
      {/* Animated background elements */}
      <div className="hero-background">
        <div className="hero-bg-circle-1 animate-float"></div>
        <div className="hero-bg-circle-2 animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="hero-container">
        {/* Logo/Brand */}
        <div ref={logoRef} className="hero-logo">
          <div className="logo-circle">
            <span className="logo-text">DB</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 ref={titleRef} className="hero-title">
          Directory
          <span className="gradient-text">Bot</span>
        </h1>

        {/* Subtitle */}
        <p ref={subtitleRef} className="hero-subtitle">
          AI-powered insights for your website. Get personalized recommendations, 
          competitive analysis, and growth strategies tailored to your app.
        </p>

        {/* Key Features */}
        <div ref={featuresRef} className="features-grid">
          {[
            { icon: '🤖', title: 'AI Analysis', desc: 'Smart insights powered by Gemini AI' },
            { icon: '📊', title: 'Competitive Intel', desc: 'Learn from similar successful sites' },
            { icon: '🚀', title: 'Growth Tips', desc: 'Actionable strategies for your app' }
          ].map((feature, index) => (
            <div key={index} className="feature-card group">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          ref={buttonRef}
          onClick={onGetStarted}
          className="cta-button group"
        >
          <span className="button-content">
            <span>Analyze My App</span>
            <span className="button-arrow">→</span>
          </span>
        </button>

        {/* Trust Indicators */}
        <div ref={trustRef} className="trust-section">
          <p className="trust-text">Trusted by 1000+ successful websites</p>
          <div className="trust-items">
            {['SaaS', 'E-commerce', 'Blogs', 'Web Apps', 'Startups', 'Agencies'].map((item) => (
              <span key={item} className="trust-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};