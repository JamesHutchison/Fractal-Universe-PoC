import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SliderLabelProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number[]) => void;
}

export function SliderLabel({ 
  label, 
  value, 
  min, 
  max, 
  step = 1, 
  onChange 
}: SliderLabelProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-white">{label}</Label>
        <span className="text-sm text-white opacity-80">{value.toFixed(1)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={onChange}
      />
    </div>
  );
}
