import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Environmental Impact | Link Flame",
  description: "Track our environmental impact: carbon offset, plastic reduction, and community contributions. Transparency in sustainability.",
  openGraph: {
    title: "Our Environmental Impact | Link Flame",
    description: "See the real numbers behind our sustainability commitment.",
  },
};

// Leaf icon
const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// CO2 data
const carbonData = {
  totalOffset: 52450, // kg
  monthlyAverage: 4370,
  ordersShipped: 12500,
  offsetProjects: [
    {
      name: "Amazon Rainforest Protection",
      location: "Brazil",
      type: "Forest Conservation",
      contribution: 18000,
    },
    {
      name: "Wind Farm Development",
      location: "Texas, USA",
      type: "Renewable Energy",
      contribution: 15000,
    },
    {
      name: "Cookstove Distribution",
      location: "Kenya",
      type: "Community Development",
      contribution: 12000,
    },
    {
      name: "Mangrove Restoration",
      location: "Indonesia",
      type: "Blue Carbon",
      contribution: 7450,
    },
  ],
};

// Environmental stats
const environmentalStats = [
  {
    category: "Carbon Offset",
    stats: [
      { label: "Total CO2 Offset", value: "52,450 kg", icon: "cloud" },
      { label: "Trees Equivalent", value: "2,400", icon: "tree" },
      { label: "Flights Offset", value: "42", icon: "plane" },
    ],
  },
  {
    category: "Plastic Reduction",
    stats: [
      { label: "Plastic-Free Orders", value: "12,500", icon: "recycle" },
      { label: "Plastic Bottles Saved", value: "37,500", icon: "bottle" },
      { label: "Ocean Plastic Equiv.", value: "1,250 kg", icon: "water" },
    ],
  },
  {
    category: "Community Impact",
    stats: [
      { label: "Donated to Nonprofits", value: "$15,280", icon: "heart" },
      { label: "Environmental Orgs Supported", value: "12", icon: "users" },
      { label: "Local Jobs Created", value: "24", icon: "briefcase" },
    ],
  },
];

// Monthly progress data (simulated)
const monthlyProgress = [
  { month: "Jan", offset: 3200, orders: 890 },
  { month: "Feb", offset: 3500, orders: 950 },
  { month: "Mar", offset: 4100, orders: 1100 },
  { month: "Apr", offset: 4200, orders: 1150 },
  { month: "May", offset: 4500, orders: 1200 },
  { month: "Jun", offset: 4800, orders: 1280 },
  { month: "Jul", offset: 5100, orders: 1350 },
  { month: "Aug", offset: 5200, orders: 1400 },
  { month: "Sep", offset: 5400, orders: 1450 },
  { month: "Oct", offset: 5600, orders: 1500 },
  { month: "Nov", offset: 5850, orders: 1550 },
  { month: "Dec", offset: 6000, orders: 1600 },
];

// Simple bar chart component
function SimpleBarChart({ data }: { data: { month: string; offset: number }[] }) {
  const maxValue = Math.max(...data.map((d) => d.offset));
  return (
    <div className="flex items-end gap-1 h-48">
      {data.map((item) => (
        <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-green-500 dark:bg-green-600 rounded-t transition-all"
            style={{ height: `${(item.offset / maxValue) * 100}%` }}
            title={`${item.offset} kg CO2`}
          />
          <span className="text-xs text-muted-foreground">{item.month.slice(0, 1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ImpactPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/20 dark:to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-medium text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 mb-6">
              <LeafIcon className="h-4 w-4" />
              {currentYear} Impact Report
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Our Environmental{" "}
              <span className="text-teal-600 dark:text-teal-400">Impact</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              Transparency is key to accountability. Here's a detailed look at our environmental
              footprint and the positive impact we're making together.
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
              <div className="text-3xl font-bold">{carbonData.totalOffset.toLocaleString()} kg</div>
              <div className="text-green-100">Total CO2 Offset</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 p-6 text-white">
              <div className="text-3xl font-bold">{carbonData.ordersShipped.toLocaleString()}</div>
              <div className="text-blue-100">Orders Shipped Carbon-Neutral</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white">
              <div className="text-3xl font-bold">$15,280</div>
              <div className="text-purple-100">Donated to Environmental Causes</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-amber-100">Plastic-Free Packaging</div>
            </div>
          </div>
        </div>
      </section>

      {/* Carbon Offset Details */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Carbon Offset Progress
          </h2>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Monthly Carbon Offset (kg CO2)</h3>
              <SimpleBarChart data={monthlyProgress} />
              <p className="mt-4 text-sm text-muted-foreground">
                Showing monthly carbon offset for {currentYear}. We're on track to offset over
                60,000 kg of CO2 this year.
              </p>
            </div>

            {/* Projects */}
            <div className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Offset Projects We Support</h3>
              <div className="space-y-4">
                {carbonData.offsetProjects.map((project) => (
                  <div key={project.name} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                      <LeafIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {project.name}
                        </h4>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {project.contribution.toLocaleString()} kg
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.location} - {project.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Detailed Impact Metrics
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {environmentalStats.map((category) => (
              <div
                key={category.category}
                className="rounded-xl border bg-white p-6 dark:bg-gray-900 dark:border-gray-800"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {category.category}
                </h3>
                <div className="space-y-4">
                  {category.stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{stat.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equivalencies */}
      <section className="py-16 bg-green-50 dark:bg-green-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              What Does {carbonData.totalOffset.toLocaleString()} kg of CO2 Look Like?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Putting our carbon offset into perspective
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { icon: "car", value: "215,000", label: "miles not driven" },
              { icon: "tree", value: "2,400", label: "trees planted for 10 years" },
              { icon: "home", value: "5.2", label: "homes powered for a year" },
              { icon: "plane", value: "42", label: "cross-country flights" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white p-6 text-center shadow-sm dark:bg-gray-900"
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {item.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Our {currentYear + 1} Goals
            </h2>
            <div className="space-y-6">
              {[
                {
                  goal: "Offset 100,000 kg of CO2",
                  current: 52450,
                  target: 100000,
                  unit: "kg",
                },
                {
                  goal: "Ship 25,000 plastic-free orders",
                  current: 12500,
                  target: 25000,
                  unit: "orders",
                },
                {
                  goal: "Donate $30,000 to environmental causes",
                  current: 15280,
                  target: 30000,
                  unit: "$",
                },
                {
                  goal: "Achieve B Corp certification",
                  current: 75,
                  target: 100,
                  unit: "% complete",
                },
              ].map((item) => {
                const percentage = Math.min((item.current / item.target) * 100, 100);
                return (
                  <div key={item.goal} className="rounded-lg border p-4 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">{item.goal}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.current.toLocaleString()} / {item.target.toLocaleString()} {item.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-teal-600 dark:bg-teal-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Be Part of the Solution
          </h2>
          <p className="mt-4 text-lg text-teal-100 max-w-2xl mx-auto">
            Every purchase you make contributes to our environmental impact.
            Shop sustainably and help us reach our goals.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-teal-600 shadow-sm transition-colors hover:bg-gray-100"
            >
              Shop Now
            </Link>
            <Link
              href="/sustainability"
              className="inline-flex items-center rounded-lg border border-white px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Learn About Our Commitment
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
