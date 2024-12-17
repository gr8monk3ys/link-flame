"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"

interface ChargingStation {
  id: string
  name: string
  address: string
  connectorTypes: string[]
  available: boolean
  distance: number
}

// Mock data for demonstration
const mockStations: ChargingStation[] = [
  {
    id: "1",
    name: "City Center Charging",
    address: "123 Main St, Downtown",
    connectorTypes: ["CCS", "CHAdeMO"],
    available: true,
    distance: 0.5
  },
  {
    id: "2",
    name: "Shopping Mall Station",
    address: "456 Market Ave",
    connectorTypes: ["Type 2", "CCS"],
    available: true,
    distance: 1.2
  },
  {
    id: "3",
    name: "Public Parking Charger",
    address: "789 Park Road",
    connectorTypes: ["Type 2"],
    available: false,
    distance: 2.1
  }
]

export function ChargingStationMap() {
  const [location, setLocation] = useState("")
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(false)

  const searchStations = async () => {
    setLoading(true)
    // In a real implementation, this would make an API call to a charging station service
    // For now, we'll use mock data
    setTimeout(() => {
      setStations(mockStations)
      setLoading(false)
    }, 1000)
  }

  useEffect(() => {
    // Get user's location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`)
          searchStations()
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter location or postcode"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={searchStations} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <Card key={station.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{station.name}</h3>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  station.available
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {station.available ? "Available" : "In Use"}
              </span>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">{station.address}</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {station.connectorTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-secondary px-2 py-1 text-xs"
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="text-sm">
              <span className="font-medium">{station.distance}</span> km away
            </p>
          </Card>
        ))}
      </div>

      {stations.length === 0 && !loading && (
        <p className="text-center text-muted-foreground">
          No charging stations found in this area. Try another location.
        </p>
      )}

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Note: In a production environment, this would integrate with real charging
        station APIs and display an interactive map.
      </div>
    </div>
  )
}
