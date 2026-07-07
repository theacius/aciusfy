"use client";

import { cn } from "@/lib/utils";

interface WaveBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function WaveBackground({ children, className }: WaveBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-background", className)}>
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute bottom-0 w-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="wave-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path fill="url(#wave-grad-3)" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;30,0;0,0"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          <path fill="url(#wave-grad-2)" d="M0,256L48,261.3C96,267,192,277,288,266.7C384,256,480,224,576,218.7C672,213,768,235,864,245.3C960,256,1056,256,1152,240C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;-20,0;0,0"
              dur="6s"
              repeatCount="indefinite"
            />
          </path>
          <path fill="url(#wave-grad-1)" d="M0,288L48,282.7C96,277,192,267,288,261.3C384,256,480,256,576,266.7C672,277,768,299,864,293.3C960,288,1056,256,1152,245.3C1248,235,1344,245,1392,250.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0;15,0;0,0"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
        </svg>

        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-accent-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
