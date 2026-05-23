import { useEffect, useRef, useState } from "react";

export function useCountingNumber(target: number, enabled: boolean) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frame = 0;
    const start = valueRef.current;
    const delta = target - start;
    const startTime = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = start + delta * eased;
      valueRef.current = next;
      setValue(next);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        valueRef.current = target;
        setValue(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, target]);

  return enabled ? value : target;
}
