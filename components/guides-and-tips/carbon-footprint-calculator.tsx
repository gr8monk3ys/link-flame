"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { formatNumber } from "@/lib/utils"

interface FootprintFactors {
  homeEnergy: {
    electricity: number // kWh per month
    gas: number // therms per month
    renewable: number // percentage
  }
  transportation: {
    carMiles: number // miles per year
    carEfficiency: number // mpg
    publicTransit: number // miles per year
    flights: number // flights per year
  }
  lifestyle: {
    dietType: "meat-heavy" | "average" | "vegetarian" | "vegan"
    recycling: boolean
    composting: boolean
  }
}

const DEFAULT_FACTORS: FootprintFactors = {
  homeEnergy: {
    electricity: 900,
    gas: 50,
    renewable: 0
  },
  transportation: {
    carMiles: 12000,
    carEfficiency: 25,
    publicTransit: 1000,
    flights: 2
  },
  lifestyle: {
    dietType: "average",
    recycling: true,
    composting: false
  }
}

const CO2_FACTORS = {
  electricity: 0.92, // lbs CO2 per kWh
  gas: 11.7, // lbs CO2 per therm
  car: 19.6, // lbs CO2 per gallon gas
  publicTransit: 0.14, // lbs CO2 per mile
  flight: 1100, // lbs CO2 per flight (average domestic)
  diet: {
    "meat-heavy": 3.3,
    "average": 2.5,
    "vegetarian": 1.7,
    "vegan": 1.5
  } // metric tons CO2 per year
}

export function CarbonFootprintCalculator() {
  const [factors, setFactors] = useState<FootprintFactors>(DEFAULT_FACTORS)
  const [showResults, setShowResults] = useState(false)

  const calculateFootprint = () => {
    // Home Energy
    const electricityEmissions = 
      factors.homeEnergy.electricity * 12 * CO2_FACTORS.electricity * (1 - factors.homeEnergy.renewable / 100)
    const gasEmissions = factors.homeEnergy.gas * 12 * CO2_FACTORS.gas

    // Transportation
    const carEmissions = 
      (factors.transportation.carMiles / factors.transportation.carEfficiency) * CO2_FACTORS.car
    const transitEmissions = factors.transportation.publicTransit * CO2_FACTORS.publicTransit
    const flightEmissions = factors.transportation.flights * CO2_FACTORS.flight

    // Lifestyle
    const dietEmissions = CO2_FACTORS.diet[factors.lifestyle.dietType] * 2204.62 // convert metric tons to lbs

    // Calculate total and adjustments
    let totalEmissions = 
      electricityEmissions + 
      gasEmissions + 
      carEmissions + 
      transitEmissions + 
      flightEmissions + 
      dietEmissions

    // Apply recycling and composting reductions
    if (factors.lifestyle.recycling) totalEmissions *= 0.95 // 5% reduction
    if (factors.lifestyle.composting) totalEmissions *= 0.98 // 2% reduction

    return {
      total: totalEmissions / 2204.62, // convert to metric tons
      breakdown: {
        home: (electricityEmissions + gasEmissions) / 2204.62,
        transport: (carEmissions + transitEmissions + flightEmissions) / 2204.62,
        lifestyle: dietEmissions / 2204.62
      }
    }
  }

  const impact = calculateFootprint()

  return (
    <div className="space-y-8">
      {/* Home Energy Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Home Energy</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="carbon-monthly-electricity-usage">Monthly Electricity Usage (kWh)</Label>
            <Input inputMode="decimal" name="electricity" autoComplete="off" id="carbon-monthly-electricity-usage"
              type="number"
              value={factors.homeEnergy.electricity}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  homeEnergy: {
                    ...prev.homeEnergy,
                    electricity: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="carbon-monthly-natural-gas-usage">Monthly Natural Gas Usage (therms)</Label>
            <Input inputMode="decimal" name="gas" autoComplete="off" id="carbon-monthly-natural-gas-usage"
              type="number"
              value={factors.homeEnergy.gas}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  homeEnergy: {
                    ...prev.homeEnergy,
                    gas: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
          <div>
            <Label>Renewable Energy Percentage</Label>
            <Slider
              thumbLabel="Renewable energy percentage"
              value={[factors.homeEnergy.renewable]}
              onValueChange={(value) => 
                setFactors((prev) => ({
                  ...prev,
                  homeEnergy: {
                    ...prev.homeEnergy,
                    renewable: value[0]
                  }
                }))
              }
              max={100}
              step={1}
            />
            <span className="text-sm text-muted-foreground">{factors.homeEnergy.renewable}%</span>
          </div>
        </div>
      </Card>

      {/* Transportation Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Transportation</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="carbon-annual-car-miles">Annual Car Miles</Label>
            <Input inputMode="decimal" name="carMiles" autoComplete="off" id="carbon-annual-car-miles"
              type="number"
              value={factors.transportation.carMiles}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  transportation: {
                    ...prev.transportation,
                    carMiles: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="carbon-car-fuel-efficiency">Car Fuel Efficiency (MPG)</Label>
            <Input inputMode="decimal" name="carEfficiency" autoComplete="off" id="carbon-car-fuel-efficiency"
              type="number"
              value={factors.transportation.carEfficiency}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  transportation: {
                    ...prev.transportation,
                    carEfficiency: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="carbon-annual-public-transit-miles">Annual Public Transit Miles</Label>
            <Input inputMode="decimal" name="publicTransit" autoComplete="off" id="carbon-annual-public-transit-miles"
              type="number"
              value={factors.transportation.publicTransit}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  transportation: {
                    ...prev.transportation,
                    publicTransit: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="carbon-flights-per-year">Flights per Year</Label>
            <Input inputMode="numeric" name="flights" autoComplete="off" id="carbon-flights-per-year"
              type="number"
              value={factors.transportation.flights}
              onChange={(e) => 
                setFactors((prev) => ({
                  ...prev,
                  transportation: {
                    ...prev.transportation,
                    flights: Number(e.target.value)
                  }
                }))
              }
            />
          </div>
        </div>
      </Card>

      {/* Lifestyle Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Lifestyle</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="carbon-diet-type">Diet Type</Label>
            <Select
              value={factors.lifestyle.dietType}
              onValueChange={(value: "meat-heavy" | "average" | "vegetarian" | "vegan") =>
                setFactors((prev) => ({
                  ...prev,
                  lifestyle: {
                    ...prev.lifestyle,
                    dietType: value
                  }
                }))
              }
            >
              <SelectTrigger id="carbon-diet-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meat-heavy">Meat Heavy</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={factors.lifestyle.recycling}
                onChange={(e) => 
                  setFactors((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...prev.lifestyle,
                      recycling: e.target.checked
                    }
                  }))
                }
                className="size-4 rounded border-border"
              />
              <span className="text-sm font-medium leading-none">Regular Recycling</span>
            </label>
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={factors.lifestyle.composting}
                onChange={(e) => 
                  setFactors((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...prev.lifestyle,
                      composting: e.target.checked
                    }
                  }))
                }
                className="size-4 rounded border-border"
              />
              <span className="text-sm font-medium leading-none">Home Composting</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      <Card className="p-6" role="status" aria-live="polite">
        <h3 className="mb-4 text-lg font-semibold">Your Carbon Footprint</h3>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold">{formatNumber(impact.total, 1)} metric tons CO₂e/year</p>
            <p className="text-sm text-muted-foreground">
              The average American footprint is 16 metric tons CO₂e/year
            </p>
          </div>
          <div className="space-y-2">
            <p>Breakdown:</p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              <li>Home Energy: {formatNumber(impact.breakdown.home, 1)} tons CO₂e</li>
              <li>Transportation: {formatNumber(impact.breakdown.transport, 1)} tons CO₂e</li>
              <li>Lifestyle: {formatNumber(impact.breakdown.lifestyle, 1)} tons CO₂e</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold">Recommended Actions:</p>
            <ul className="space-y-2">
              {impact.breakdown.home > 4 && (
                <li>
                  <Link href="/guides-and-tips/green-home" className="text-primary hover:underline">
                    → Explore home energy efficiency upgrades
                  </Link>
                </li>
              )}
              {impact.breakdown.transport > 4 && (
                <li>
                  <Link href="/clean-transport" className="text-primary hover:underline">
                    → Consider electric or hybrid vehicles
                  </Link>
                </li>
              )}
              {impact.breakdown.lifestyle > 3 && (
                <li>
                  <Link href="/zero-waste" className="text-primary hover:underline">
                    → Learn about reducing waste and sustainable diet choices
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
