"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FadeIn, PopIn } from "@/components/ui/animations"

interface ChargingStation {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  availablePoints: number
  totalPoints: number
  powerTypes: string[]
  status: "available" | "busy" | "offline"
}

const chargingStations: ChargingStation[] = [
  {
    id: "1",
    name: "Supercharger Station 1",
    address: "123 Main St, Anytown USA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    availablePoints: 5,
    totalPoints: 10,
    powerTypes: ["Level 2", "DC Fast Charging"],
    status: "available",
  },
  {
    id: "2",
    name: "EVgo Charging Station",
    address: "456 Oak Ave, Anytown USA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    availablePoints: 2,
    totalPoints: 4,
    powerTypes: ["DC Fast Charging"],
    status: "busy",
  },
  {
    id: "3",
    name: "ChargePoint Station",
    address: "789 Pine Ln, Anytown USA",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    availablePoints: 0,
    totalPoints: 6,
    powerTypes: ["Level 2"],
    status: "offline",
  },
];

export function ChargingStationMap() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const getStatusColor = (status: ChargingStation["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "offline":
        return "bg-red-500"
    }
  }

  const filteredStations = chargingStations.filter((station) =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-[600px]">
      <FadeIn>
        <div className="absolute inset-x-4 top-4 z-10">
          <Card className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for charging stations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button>Search</Button>
              </motion.div>
            </div>
          </Card>
        </div>
      </FadeIn>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="size-full overflow-y-scroll bg-gray-100"
      >
        {filteredStations.map((station) => (
          <motion.div
            key={station.id}
            className="cursor-pointer border-b border-gray-200 p-4 hover:bg-gray-50"
            onClick={() => setSelectedStation(station)}
            whileHover={{ backgroundColor: "#f0f0f0" }}
          >
            <h3 className="text-lg font-semibold">{station.name}</h3>
            <p className="text-sm text-muted-foreground">{station.address}</p>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedStation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-x-4 bottom-4 z-10"
          >
            <Card className="p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedStation.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedStation.address}
                  </p>
                </div>
                <motion.button
                  className="rounded-full p-1 hover:bg-gray-100"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedStation(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-3 rounded-full ${getStatusColor(
                      selectedStation.status
                    )}`}
                  />
                  <span className="capitalize">{selectedStation.status}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedStation.availablePoints}/{selectedStation.totalPoints}{" "}
                    Points Available
                  </Badge>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-medium">Charging Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStation.powerTypes.map((type) => (
                      <PopIn key={type}>
                        <Badge variant="outline">{type}</Badge>
                      </PopIn>
                    ))}
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full">Get Directions</Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute bottom-4 right-4 z-10 space-x-2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-white p-2 shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="rounded-full bg-white p-2 shadow-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
