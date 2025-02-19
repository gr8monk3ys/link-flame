import { ChargingStationMap } from "@/components/home/charging-station-map";

export default function MapSection() {
  return (
    <section className="section-spacing">
      <h2 className="mb-12 text-center">Find Charging Stations Near You</h2>
      <div className="glass-effect rounded-lg p-4">
        <ChargingStationMap />
      </div>
    </section>
  );
}
