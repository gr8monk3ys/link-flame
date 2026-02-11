import { ChargingStationMap } from "@/components/home/charging-station-map";

export default function MapSection() {
  return (
    <section className="section-spacing">
      <h2 className="mb-12 text-center font-serif">Find Charging Stations Near You</h2>
      <div className="glass-effect rounded-xl p-6">
        <ChargingStationMap />
      </div>
    </section>
  );
}
