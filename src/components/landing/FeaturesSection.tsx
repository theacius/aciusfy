"use client";

import { Music, Radio, Users, Headphones, Heart, Sparkles } from "lucide-react";
import { BentoGrid } from "@/components/landing/bento-grid";

const features = [
  {
    icon: Music,
    titleKey: "landingFeat0Title" as const,
    descKey: "landingFeat0Desc" as const,
    span: "lg:col-span-2 lg:row-span-2 lg:min-h-[320px]",
  },
  {
    icon: Radio,
    titleKey: "landingFeat1Title" as const,
    descKey: "landingFeat1Desc" as const,
  },
  {
    icon: Users,
    titleKey: "landingFeat2Title" as const,
    descKey: "landingFeat2Desc" as const,
  },
  {
    icon: Headphones,
    titleKey: "landingFeat3Title" as const,
    descKey: "landingFeat3Desc" as const,
    span: "lg:col-span-2",
  },
  {
    icon: Heart,
    titleKey: "landingFeat4Title" as const,
    descKey: "landingFeat4Desc" as const,
  },
  {
    icon: Sparkles,
    titleKey: "landingFeat5Title" as const,
    descKey: "landingFeat5Desc" as const,
  },
];

export function FeaturesSection() {
  return <BentoGrid features={features} />;
}
