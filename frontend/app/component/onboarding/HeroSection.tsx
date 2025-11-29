import { useRef } from 'react';
import { gsap } from 'gsap';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div ref={heroRef} className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">DB</span>
          </div>
        </div>

        {/* Main Heading */}
        <h1 
          ref={titleRef}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
        >
          Directory
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Bot
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          AI-powered insights for your website. Get personalized recommendations, 
          competitive analysis, and growth strategies tailored to your app.
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
          {[
            { icon: '🤖', title: 'AI Analysis', desc: 'Smart insights powered by Gemini AI' },
            { icon: '📊', title: 'Competitive Intel', desc: 'Learn from similar successful sites' },
            { icon: '🚀', title: 'Growth Tips', desc: 'Actionable strategies for your app' }
          ].map((feature, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
              <div className="text-2xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          ref={buttonRef}
          onClick={onGetStarted}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          Analyze My App →
        </button>

        {/* Trust Indicators */}
        <div className="mt-16 text-gray-500">
          <p className="text-sm mb-4">Get insights from 1000+ successful websites</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            {['SaaS', 'E-commerce', 'Blogs', 'Web Apps'].map((item) => (
              <span key={item} className="text-sm">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};