"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface TransportMode {
  name: string
  co2PerKm: number // grams of CO2 per kilometer
  costPerKm: number // cost per kilometer
  alternativeProducts?: {
    name: string
    cost: number
    link: string
    co2Savings: number // percentage reduction
  }[]
}

const transportModes: TransportMode[] = [
  {
    name: "Gasoline Car",
    co2PerKm: 192,
    costPerKm: 0.12,
    alternativeProducts: [
      {
        name: "Electric Vehicle",
        cost: 35000,
        link: "/product/electric-vehicle",
        co2Savings: 60
      }
    ]
  },
  {
    name: "Public Transit",
    co2PerKm: 89,
    costPerKm: 0.05
  },
  {
    name: "E-Bike",
    co2PerKm: 22,
    costPerKm: 0.02,
    alternativeProducts: [
      {
        name: "Commuter E-Bike",
        cost: 1500,
        link: "/product/commuter-ebike",
        co2Savings: 88
      }
    ]
  },
  {
    name: "Walking/Cycling",
    co2PerKm: 0,
    costPerKm: 0,
    alternativeProducts: [
      {
        name: "City Bike",
        cost: 500,
        link: "/product/city-bike",
        co2Savings: 100
      }
    ]
  }
]

export function TransportCalculator() {
  const [mode, setMode] = useState<TransportMode>(transportModes[0])
  const [distance, setDistance] = useState(20) // daily commute in km
  const [daysPerWeek, setDaysPerWeek] = useState(5)
  const [showResults, setShowResults] = useState(false)

  const calculateImpact = () => {
    const yearlyDistance = distance * daysPerWeek * 52
    const yearlyCO2 = (yearlyDistance * mode.co2PerKm) / 1000 // convert to kg
    const yearlyCost = yearlyDistance * mode.costPerKm

    return {
      distance: yearlyDistance.toFixed(0),
      co2: yearlyCO2.toFixed(1),
      cost: yearlyCost.toFixed(2),
      alternatives: mode.alternativeProducts?.map(alt => ({
        ...alt,
        co2Saved: ((yearlyCO2 * alt.co2Savings) / 100).toFixed(1)
      }))
    }
  }

  const handleCalculate = () => {
    setShowResults(true)
  }

  const impact = calculateImpact()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Transport Mode</Label>
        <Select
          value={mode.name}
          onValueChange={(value) => {
            const selectedMode = transportModes.find(m => m.name === value)
            if (selectedMode) {
              setMode(selectedMode)
              setShowResults(false)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue>{mode.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {transportModes.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Daily Distance (km)</Label>
        <Input
          type="number"
          value={distance}
          onChange={(e) => {
            setDistance(Number(e.target.value))
            setShowResults(false)
          }}
          min="1"
        />
      </div>

      <div className="space-y-2">
        <Label>Days per Week</Label>
        <Input
          type="number"
          value={daysPerWeek}
          onChange={(e) => {
            setDaysPerWeek(Number(e.target.value))
            setShowResults(false)
          }}
          min="1"
          max="7"
        />
      </div>

      <Button onClick={handleCalculate} className="w-full">
        Calculate Impact
      </Button>

      {showResults && (
        <Card className="mt-4 p-4">
          <h3 className="mb-2 font-semibold">Yearly Impact</h3>
          <ul className="space-y-2 text-sm">
            <li>Total Distance: {impact.distance} km</li>
            <li>CO2 Emissions: {impact.co2} kg</li>
            <li>Total Cost: ${impact.cost}</li>
            {impact.alternatives && (
              <li className="mt-4">
                <p className="font-semibold">Greener Alternatives:</p>
                <ul className="mt-2 space-y-2">
                  {impact.alternatives.map((alt) => (
                    <li key={alt.name} className="flex items-center justify-between">
                      <span>{alt.name}</span>
                      <div className="text-right">
                        <div>Save {alt.co2Saved} kg CO2/year</div>
                        <Button asChild variant="link" className="h-auto p-0">
                          <Link href={alt.link}>View Details</Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </Card>
      )}
    </div>
  )
}
