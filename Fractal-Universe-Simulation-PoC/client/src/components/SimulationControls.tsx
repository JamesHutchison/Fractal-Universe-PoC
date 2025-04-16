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
    spacetimePressure,
    setSpacetimePressure,
    setSpacetimePressureMultiplier,
    spacetimePressureMultiplier,
    energySize,
    setEnergySize,
    energyBaseShedRate,
    setEnergyBaseShedRate,
    energyDisplacementShedRate,
    setEnergyDisplacementShedRate,
    energyShedFactor,
    setEnergyShedFactor,
    showGrid,
    setShowGrid,
    showVelocityVectors,
    setShowVelocityVectors,
    lateralDisplacementFactor,
    setLateralDisplacementFactor,
    parentFieldSkew,
    setParentFieldSkew,
    timeFactor,
    setTimeFactor,
    showTimeEffects,
    setShowTimeEffects,
  } = useSimulation();

  return (
    <Card className="bg-slate-800 shadow-md overflow-hidden">
      <CardContent className="pt-4 pb-4 overflow-y-auto max-h-[75vh] ">
        <div className="grid gap-4">
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
            <SliderLabel
              label="Parent Field Skew"
              value={parentFieldSkew}
              min={-0.5}
              max={0.5}
              step={0.02}
              onChange={(value) => setParentFieldSkew(value[0])}
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
              min={-1}
              max={1}
              step={0.1}
              onChange={(value) => setEnergySteerFactor(value[0])}
            />

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
              label="Lateral Displacement Factor"
              value={lateralDisplacementFactor}
              min={0}
              max={10}
              step={0.05}
              onChange={(value) => setLateralDisplacementFactor(value[0])}
            />

            <SliderLabel
              label="Falloff Rate"
              value={falloffRate}
              min={0}
              max={3.5}
              step={0.05}
              onChange={(value) => setFalloffRate(value[0])}
            />
            <SliderLabel
              label="Spacetime Pressure"
              value={spacetimePressure}
              min={0}
              max={5}
              step={0.05}
              onChange={(value) => setSpacetimePressure(value[0])}
            />
            <SliderLabel
              label="Spacetime Pressure Multiplier"
              value={spacetimePressureMultiplier}
              min={0}
              max={4}
              step={0.2}
              onChange={(value) => setSpacetimePressureMultiplier(value[0])}
            />
            <SliderLabel
              label="Blend Rate"
              value={propagationRate}
              min={0}
              max={1}
              step={0.1}
              onChange={(value) => setPropagationRate(value[0])}
            />
            <SliderLabel
              label="Time Factor"
              value={timeFactor}
              min={-8}
              max={8}
              step={0.5}
              onChange={(value) => setTimeFactor(value[0])}
            />
            <div>{timeFactor < 2 ? "Linear time effects" : "Squared time effects"} </div>

            <SliderLabel
              label="Show Time Effects"
              value={showTimeEffects}
              min={0}
              max={1}
              step={1}
              onChange={(value) => setShowTimeEffects(value[0])}
            />

            <SliderLabel
              label="Energy Base Shed Rate"
              value={energyBaseShedRate}
              min={0}
              max={0.5}
              step={0.01}
              onChange={(value) => setEnergyBaseShedRate(value[0])}
            />

            <SliderLabel
              label="Energy Displacement Shed Rate"
              value={energyDisplacementShedRate}
              min={0}
              max={1.0}
              step={0.02}
              onChange={(value) => setEnergyDisplacementShedRate(value[0])}
            />

            <SliderLabel
              label="Energy Shed Factor"
              value={energyShedFactor}
              min={0.1}
              max={2.0}
              step={0.1}
              onChange={(value) => setEnergyShedFactor(value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
