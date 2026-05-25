import { Icons } from "./Icons";

interface StepperProps {
  val: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}

export function Stepper({ val, min = 5, max = 240, step = 5, onChange }: StepperProps) {
  return (
    <div className="stepper">
      <button className="stepper__btn" onClick={() => onChange(Math.max(min, val - step))}><Icons.minus w={12} sw={2} /></button>
      <div className="stepper__val">
        <span className="stepper__num">{val}</span>
        <span className="stepper__unit">min</span>
      </div>
      <button className="stepper__btn" onClick={() => onChange(Math.min(max, val + step))}><Icons.plus w={12} sw={2} /></button>
    </div>
  );
}
