"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CalculatorInputs {
  energyUsage: number
  transportationType: string
  dietType: string
  wasteProduction: number
  householdSize: number
}

export function SustainabilityCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    energyUsage: 0,
    transportationType: "car",
    dietType: "mixed",
    wasteProduction: 0,
    householdSize: 1,
  })

  const [results, setResults] = useState<{
    carbonFootprint: number
    suggestions: string[]
  } | null>(null)

  const calculateFootprint = () => {
    // This is a simplified calculation - in reality, you'd want more complex formulas
    let totalCarbon = 0

    // Energy usage (kWh per month)
    totalCarbon += inputs.energyUsage * 0.5 // Approximate CO2 per kWh

    // Transportation
    const transportationFactors = {
      car: 404, // g CO2 per mile
      publicTransit: 140,
      bicycle: 0,
      walking: 0,
    }
    totalCarbon +=
      transportationFactors[inputs.transportationType as keyof typeof transportationFactors] * 30 // Assuming 30 days

    // Diet
    const dietFactors = {
      vegan: 1.5,
      vegetarian: 1.7,
      mixed: 2.5,
      highMeat: 3.3,
    }
    totalCarbon +=
      dietFactors[inputs.dietType as keyof typeof dietFactors] * 1000

    // Waste
    totalCarbon += inputs.wasteProduction * 700 // Approximate CO2 per kg of waste

    // Adjust for household size
    totalCarbon = totalCarbon / inputs.householdSize

    // Generate suggestions
    const suggestions = []
    if (inputs.energyUsage > 500)
      suggestions.push("Consider switching to energy-efficient appliances")
    if (inputs.transportationType === "car")
      suggestions.push(
        "Try using public transportation or cycling for shorter trips"
      )
    if (inputs.dietType === "highMeat")
      suggestions.push("Reducing meat consumption can lower your carbon footprint")
    if (inputs.wasteProduction > 2)
      suggestions.push("Implement recycling and composting to reduce waste")

    setResults({
      carbonFootprint: totalCarbon / 1000, // Convert to metric tons
      suggestions,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Carbon Footprint Calculator</CardTitle>
          <CardDescription>
            Estimate your environmental impact and get personalized suggestions for
            improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="energy">Monthly Energy Usage (kWh)</Label>
            <Input
              id="energy"
              type="number"
              value={inputs.energyUsage}
              onChange={(e) =>
                setInputs({ ...inputs, energyUsage: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transportation">Primary Transportation</Label>
            <Select
              value={inputs.transportationType}
              onValueChange={(value) =>
                setInputs({ ...inputs, transportationType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="publicTransit">Public Transit</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diet">Diet Type</Label>
            <Select
              value={inputs.dietType}
              onValueChange={(value) =>
                setInputs({ ...inputs, dietType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="mixed">Mixed/Balanced</SelectItem>
                <SelectItem value="highMeat">High Meat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waste">Weekly Waste Production (kg)</Label>
            <Input
              id="waste"
              type="number"
              value={inputs.wasteProduction}
              onChange={(e) =>
                setInputs({ ...inputs, wasteProduction: Number(e.target.value) })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="household">Household Size</Label>
            <Input
              id="household"
              type="number"
              value={inputs.householdSize}
              onChange={(e) =>
                setInputs({ ...inputs, householdSize: Number(e.target.value) })
              }
            />
          </div>

          <Button onClick={calculateFootprint} className="mt-4 w-full">
            Calculate Footprint
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Annual Carbon Footprint:
                </h3>
                <p className="text-3xl font-bold text-primary">
                  {results.carbonFootprint.toFixed(2)} metric tons CO₂e
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Suggestions for Improvement:
                </h3>
                <ul className="list-inside list-disc space-y-2">
                  {results.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
