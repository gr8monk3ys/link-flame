import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Tip {
  title: string
  description: string
  category: string
  difficulty: "Easy" | "Medium" | "Advanced"
  link: string
}

const tips: Tip[] = [
  {
    title: "Bring Your Own Bags",
    description: "Keep reusable bags in your car or by your door to never forget them when shopping.",
    category: "Shopping",
    difficulty: "Easy",
    link: "/zero-waste/shopping"
  },
  {
    title: "Start Composting",
    description: "Turn food scraps into nutrient-rich soil for your garden.",
    category: "Kitchen",
    difficulty: "Medium",
    link: "/zero-waste/composting"
  },
  {
    title: "Switch to Bar Products",
    description: "Replace liquid soaps and shampoos with package-free bar alternatives.",
    category: "Bathroom",
    difficulty: "Easy",
    link: "/zero-waste/bathroom"
  },
  {
    title: "Buy in Bulk",
    description: "Reduce packaging waste by buying dry goods from bulk bins using your own containers.",
    category: "Shopping",
    difficulty: "Medium",
    link: "/zero-waste/shopping"
  }
]

export function WasteReductionTips() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tips.map((tip) => (
        <Card key={tip.title} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge variant={tip.difficulty === "Easy" ? "default" : "secondary"}>
              {tip.difficulty}
            </Badge>
            <Badge variant="outline">{tip.category}</Badge>
          </div>
          <h3 className="mb-2 font-semibold">{tip.title}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{tip.description}</p>
          <Link
            href={tip.link}
            className="text-sm font-medium text-primary hover:underline"
          >
            Learn More →
          </Link>
        </Card>
      ))}
    </div>
  )
}
