import { useEffect } from "react";
import { gsap } from "gsap";
import "./FormProgress.css";

interface FormProgressProps {
  steps: Array<{ id: number; title: string; description?: string }>;
  currentStep: number;
}

export const FormProgress = ({ steps, currentStep }: FormProgressProps) => {
  useEffect(() => {
    // Animate all circles
    const circles = gsap.utils.toArray<HTMLDivElement>(".fp-circle");

    gsap.from(circles, {
      opacity: 0,
      scale: 0.8,
      stagger: 0.12,
      duration: 0.45,
      ease: "power2.out",
    });

    // Animate progress line
    gsap.from(".fp-line-fill", {
      width: 0,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);

  const progressPercent =
    ((currentStep - 1) / Math.max(1, steps.length - 1)) * 100;

  return (
    <div className="fp-wrapper">
      <div className="fp-container">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="fp-step">
              <div
                className={
                  isCompleted
                    ? "fp-circle fp-complete"
                    : isActive
                    ? "fp-circle fp-active"
                    : "fp-circle fp-pending"
                }
              >
                {isCompleted ? "✓" : step.id}
              </div>

              <div
                className={
                  isCompleted || isActive
                    ? "fp-title fp-title-active"
                    : "fp-title fp-title-pending"
                }
              >
                {step.title}
              </div>
            </div>
          );
        })}

        <div className="fp-line-bg">
          <div
            className="fp-line-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
