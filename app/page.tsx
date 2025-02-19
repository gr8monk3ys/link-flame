import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import React from 'react';
import HeroSection from "@/components/home/HeroSection";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import ProductComparisonSection from "@/components/home/ProductComparisonSection";
import MapSection from "@/components/home/MapSection";
import CTASection from "@/components/home/CTASection";
interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function IndexPage() {
  // const features: Feature[] = [
  //   {
  //     title: "Reduce Carbon Footprint",
  //     description: "Make eco-conscious choices that help reduce your environmental impact.",
  //     icon: (props: any) => {
  //       return (
  //         <svg
  //           {...props}
  //           className="size-6 text-primary"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //           stroke="currentColor"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M5 13l4 4L19 7"
  //           />
  //         </svg>
  //       );
  //     }
  //   },
  //   {
  //     title: "Save Energy & Money",
  //     description: "Discover energy-efficient solutions that benefit both the planet and your wallet.",
  //     icon: (props: any) => {
  //       return (
  //         <svg
  //           {...props}
  //           className="size-6 text-primary"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //           stroke="currentColor"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  //           />
  //       );
  //     }
  //   },
  //   {
  //     title: "Smart Living",
  //     description: "Integrate smart technologies for a more sustainable and convenient lifestyle.",
  //     icon: (props: any) => {
  //       return (
  //         <svg
  //           {...props}
  //           className="size-6 text-primary"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //           stroke="currentColor"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
  //       />
  //       );
  //     }
  //   },
  //   {
  //     title: "Community Impact",
  //     description: "Be part of a growing community committed to environmental sustainability.",
  //     icon: (props: any) => {
  //       return (
  //         <svg
  //           {...props}
  //           className="size-6 text-primary"
  //           fill="none"
  //           viewBox="0 0 24 24"
  //           stroke="currentColor"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
  //       />
  //     );
  //   },
  // ];

  return (
    <div className="space-y-20">
      <HeroSection />

      {/* <FeaturesGrid features={features} /> */}

      <ProductComparisonSection />

      <MapSection />

      <CTASection />
    </div>
  );
}
