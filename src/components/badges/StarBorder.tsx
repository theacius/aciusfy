"use client";

interface StarBorderProps {
  color: string;
  speed?: string;
}

export function StarBorder({ color, speed = "6s" }: StarBorderProps) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-xl"
        style={{
          overflow: "hidden",
        }}
      >
        
        <div
          className="absolute"
          style={{
            width: "40%",
            height: 2,
            top: 0,
            left: 0,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: `star-streak-h ${speed} linear infinite`,
          }}
        />
        
        <div
          className="absolute"
          style={{
            width: "40%",
            height: 2,
            bottom: 0,
            right: 0,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: `star-streak-h-rev ${speed} linear infinite`,
          }}
        />
        
        <div
          className="absolute"
          style={{
            height: "40%",
            width: 2,
            right: 0,
            top: 0,
            borderRadius: 2,
            background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
            animation: `star-streak-v ${speed} linear infinite`,
          }}
        />
        
        <div
          className="absolute"
          style={{
            height: "40%",
            width: 2,
            left: 0,
            bottom: 0,
            borderRadius: 2,
            background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
            animation: `star-streak-v-rev ${speed} linear infinite`,
          }}
        />
      </div>
      
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-xl"
        style={{
          boxShadow: `0 0 8px ${color}40, inset 0 0 4px ${color}20`,
        }}
      />
    </>
  );
}
