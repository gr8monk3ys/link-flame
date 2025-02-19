"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface WasteItem {
  name: string
  disposablePerYear: number
  wasteWeight: number // in grams
  cost: number
  reusableAlternative: {
    name: string
    cost: number
    lifespan: number // in years
    link: string
  }
}

const commonItems: WasteItem[] = [
  {
    name: "Plastic Water Bottles",
    disposablePerYear: 365,
    wasteWeight: 12.7, // grams per bottle
    cost: 1.00, // cost per bottle
    reusableAlternative: {
      name: "Stainless Steel Water Bottle",
      cost: 25.00,
      lifespan: 5,
      link: "/product/stainless-steel-water-bottle"
    }
  },
  {
    name: "Coffee Cups",
    disposablePerYear: 260,
    wasteWeight: 18, // grams per cup
    cost: 3.50,
    reusableAlternative: {
      name: "Reusable Coffee Cup",
      cost: 20.00,
      lifespan: 2,
      link: "/product/reusable-coffee-cup"
    }
  },
  {
    name: "Plastic Bags",
    disposablePerYear: 170,
    wasteWeight: 5.5,
    cost: 0.10,
    reusableAlternative: {
      name: "Reusable Shopping Bags",
      cost: 15.00,
      lifespan: 3,
      link: "/product/reusable-shopping-bags"
    }
  }
]

export function ZeroWasteCalculator() {
  const [selectedItem, setSelectedItem] = useState<WasteItem>(commonItems[0])
  const [frequency, setFrequency] = useState(selectedItem.disposablePerYear)
  const [showResults, setShowResults] = useState(false)

  const calculateImpact = () => {
    const yearlyWaste = frequency * selectedItem.wasteWeight / 1000 // convert to kg
    const yearlyCost = frequency * selectedItem.cost
    const reusableCostPerYear = selectedItem.reusableAlternative.cost / selectedItem.reusableAlternative.lifespan
    const yearlySavings = yearlyCost - reusableCostPerYear

    return {
      wasteReduction: yearlyWaste.toFixed(1),
      costSavings: yearlySavings.toFixed(2),
      reusableCost: selectedItem.reusableAlternative.cost.toFixed(2)
    }
  }

  const handleCalculate = () => {
    setShowResults(true)
  }

  const impact = calculateImpact()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Item</Label>
        <select
          className="w-full rounded-md border p-2"
          value={selectedItem.name}
          onChange={(e) => {
            const item = commonItems.find(i => i.name === e.target.value)
            if (item) {
              setSelectedItem(item)
              setFrequency(item.disposablePerYear)
              setShowResults(false)
            }
          }}
        >
          {commonItems.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Usage Frequency (per year)</Label>
        <Input
          type="number"
          value={frequency}
          onChange={(e) => {
            setFrequency(Number(e.target.value))
            setShowResults(false)
          }}
          min="1"
        />
      </div>

      <Button onClick={handleCalculate} className="w-full">
        Calculate Impact
      </Button>

      {showResults && (
        <Card className="mt-4 p-4">
          <h3 className="mb-2 font-semibold">Your Impact</h3>
          <ul className="space-y-2 text-sm">
            <li>Waste Reduction: {impact.wasteReduction} kg/year</li>
            <li>Cost Savings: ${impact.costSavings}/year</li>
            <li>
              Recommended Alternative: {selectedItem.reusableAlternative.name} (${impact.reusableCost})
              <Button asChild variant="link" className="ml-2 p-0">
                <Link href={selectedItem.reusableAlternative.link}>View Product</Link>
              </Button>
            </li>
          </ul>
        </Card>
      )}
    </div>
  )
}
