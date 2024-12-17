"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface UpgradeOption {
  id: string
  name: string
  description: string
  savingsPercentage: number
  typicalCost: number
  lifespan: number // years
  productLink?: string
}

const UPGRADE_OPTIONS: Record<string, UpgradeOption[]> = {
  lighting: [
    {
      id: "led-basic",
      name: "LED Bulbs (Basic)",
      description: "Replace incandescent bulbs with standard LED bulbs",
      savingsPercentage: 75,
      typicalCost: 100,
      lifespan: 10,
      productLink: "/product/basic-led-pack"
    },
    {
      id: "led-smart",
      name: "Smart LED System",
      description: "Smart LED bulbs with motion sensors and scheduling",
      savingsPercentage: 85,
      typicalCost: 300,
      lifespan: 10,
      productLink: "/product/smart-led-system"
    }
  ],
  heating: [
    {
      id: "smart-thermostat",
      name: "Smart Thermostat",
      description: "Programmable thermostat with learning capabilities",
      savingsPercentage: 12,
      typicalCost: 250,
      lifespan: 5,
      productLink: "/product/smart-thermostat"
    },
    {
      id: "insulation",
      name: "Improved Insulation",
      description: "Add or upgrade wall and attic insulation",
      savingsPercentage: 15,
      typicalCost: 1500,
      lifespan: 25
    }
  ],
  appliances: [
    {
      id: "energy-star-fridge",
      name: "ENERGY STAR Refrigerator",
      description: "Replace old refrigerator with ENERGY STAR model",
      savingsPercentage: 15,
      typicalCost: 1200,
      lifespan: 15,
      productLink: "/product/energy-star-refrigerator"
    },
    {
      id: "energy-star-washer",
      name: "ENERGY STAR Washer",
      description: "High-efficiency washing machine",
      savingsPercentage: 25,
      typicalCost: 800,
      lifespan: 12,
      productLink: "/product/energy-star-washer"
    }
  ]
}

export function EnergySavingsCalculator() {
  const [monthlyBill, setMonthlyBill] = useState(150)
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([])
  const [electricityRate, setElectricityRate] = useState(0.14) // $ per kWh

  const calculateSavings = () => {
    const yearlyBill = monthlyBill * 12
    let totalSavings = 0
    let totalCost = 0
    let upgrades: Array<{
      name: string
      yearlySavings: number
      paybackPeriod: number
      option: UpgradeOption
    }> = []

    selectedUpgrades.forEach(upgradeId => {
      // Find the upgrade option
      const option = Object.values(UPGRADE_OPTIONS)
        .flat()
        .find(opt => opt.id === upgradeId)

      if (option) {
        const yearlySavings = (yearlyBill * option.savingsPercentage) / 100
        totalSavings += yearlySavings
        totalCost += option.typicalCost

        upgrades.push({
          name: option.name,
          yearlySavings,
          paybackPeriod: option.typicalCost / yearlySavings,
          option
        })
      }
    })

    return {
      yearlyBill,
      totalSavings,
      totalCost,
      upgrades,
      roi: (totalSavings / totalCost) * 100,
      paybackPeriod: totalCost / totalSavings
    }
  }

  const savings = calculateSavings()

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Current Energy Usage</h3>
        <div className="space-y-4">
          <div>
            <Label>Average Monthly Electricity Bill ($)</Label>
            <Input
              type="number"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Number(e.target.value))}
              min="0"
            />
          </div>
          <div>
            <Label>Electricity Rate ($ per kWh)</Label>
            <Input
              type="number"
              value={electricityRate}
              onChange={(e) => setElectricityRate(Number(e.target.value))}
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Upgrade Selection */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Select Energy Upgrades</h3>
        <div className="space-y-6">
          {Object.entries(UPGRADE_OPTIONS).map(([category, options]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium capitalize">{category}</h4>
              {options.map((option) => (
                <div key={option.id} className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedUpgrades.includes(option.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUpgrades([...selectedUpgrades, option.id])
                      } else {
                        setSelectedUpgrades(selectedUpgrades.filter(id => id !== option.id))
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <Label>{option.name}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                    <p className="text-sm">
                      Cost: ${option.typicalCost.toLocaleString()} | 
                      Savings: {option.savingsPercentage}% | 
                      Lifespan: {option.lifespan} years
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Results Section */}
      {selectedUpgrades.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Potential Savings</h3>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                ${savings.totalSavings.toFixed(2)} per year
              </p>
              <p className="text-sm text-muted-foreground">
                Total investment: ${savings.totalCost.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">ROI Analysis:</p>
              <ul className="list-inside list-disc space-y-1 text-sm">
                <li>Return on Investment: {savings.roi.toFixed(1)}%</li>
                <li>Payback Period: {savings.paybackPeriod.toFixed(1)} years</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Breakdown by Upgrade:</p>
              <div className="space-y-3">
                {savings.upgrades.map(({ name, yearlySavings, paybackPeriod, option }) => (
                  <div key={name} className="rounded-lg bg-secondary p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{name}</span>
                      <span>${yearlySavings.toFixed(2)}/year</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Payback period: {paybackPeriod.toFixed(1)} years
                    </p>
                    {option.productLink && (
                      <Button asChild variant="link" className="h-auto p-0">
                        <Link href={option.productLink}>View Product →</Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
