import { useSimulation } from "@/lib/stores/useSimulation";
import { Slider } from "@/components/ui/slider";
import { SliderLabel } from "@/components/ui/slider-label";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SimulationControls() {
  const {
    gridSize,
    setGridSize,
    energySpeed,
    energySteerFactor,
    setEnergySteerFactor,
    setEnergySpeed,
    displacementStrength,
    setDisplacementStrength,
    propagationRate,
    setPropagationRate,
    falloffRate,
    setFalloffRate,
    healingRate,
    setHealingRate,
    energySize,
    setEnergySize,
    showGrid,
    setShowGrid,
    showVelocityVectors,
    setShowVelocityVectors,
    forwardDisplacementFactor,
    setForwardDisplacementFactor,
  } = useSimulation();

  return (
    <Card className="bg-slate-800 shadow-md overflow-y-auto">
      <CardContent className="pt-4 pb-4 overflow-y-auto">
        <div className="grid gap-4 overflow-y-auto pr-4">
          <div className="space-y-2">
            <h3 className="font-medium text-white">Grid Configuration</h3>
            <Separator className="bg-slate-600" />
            <SliderLabel
              label="Grid Size"
              value={gridSize}
              min={10}
              max={400}
              step={10}
              onChange={(value) => setGridSize(value[0])}
            />

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <Label htmlFor="show-grid" className="text-white">
                Show Grid Lines
              </Label>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-medium text-white">Energy Properties</h3>
            <Separator className="bg-slate-600" />
            <SliderLabel
              label="Energy Speed"
              value={energySpeed}
              min={0.2}
              max={100}
              step={0.2}
              onChange={(value) => setEnergySpeed(value[0])}
            />

            <SliderLabel
              label="Energy Size"
              value={energySize}
              min={0.1}
              max={5}
              step={0.1}
              onChange={(value) => setEnergySize(value[0])}
            />

            <SliderLabel
              label="Energy Field Steering"
              value={energySteerFactor}
              min={-0.5}
              max={0.5}
              step={0.1}
              onChange={(value) => setEnergySteerFactor(value[0])}
            />

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="show-vectors"
                checked={showVelocityVectors}
                onCheckedChange={setShowVelocityVectors}
              />
              <Label htmlFor="show-vectors" className="text-white">
                Show Velocity Vectors
              </Label>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h3 className="font-medium text-white">Spacetime Physics</h3>
            <Separator className="bg-slate-600" />
            <SliderLabel
              label="Displacement Strength"
              value={displacementStrength}
              min={0}
              max={4}
              step={0.05}
              onChange={(value) => setDisplacementStrength(value[0])}
            />

            <SliderLabel
              label="Forward Resistance"
              value={forwardDisplacementFactor}
              min={0}
              max={10}
              step={0.05}
              onChange={(value) => setForwardDisplacementFactor(value[0])}
            />

            <SliderLabel
              label="Propagation Rate"
              value={propagationRate}
              min={0}
              max={10}
              step={0.02}
              onChange={(value) => setPropagationRate(value[0])}
            />

            <SliderLabel
              label="Falloff Rate"
              value={falloffRate}
              min={0}
              max={3.5}
              step={0.05}
              onChange={(value) => setFalloffRate(value[0])}
            />
            <div>Strobe Healing Rate from 0 to 4 to emulate gravity waves</div>
            <SliderLabel
              label="Healing Rate"
              value={healingRate}
              min={0}
              max={16}
              step={0.05}
              onChange={(value) => setHealingRate(value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
