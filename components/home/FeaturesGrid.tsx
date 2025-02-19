import Image from "next/image";
import React from 'react';

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface FeaturesGridProps {
  features: Feature[];
}

export default function FeaturesGrid({ features }: FeaturesGridProps) {
  return (
    <section className="section-spacing">
      <h2 className="mb-12 text-center">Why Choose Sustainable Living?</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src="/images/solar-panels.jpg"
            alt="Sustainable products"
            fill
            className="object-cover"
          />
        </div>
        <div className="modern-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-effect hover-card-effect rounded-lg p-6"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
