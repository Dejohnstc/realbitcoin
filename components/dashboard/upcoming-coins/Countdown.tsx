"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({ targetDate }: Props) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    function calculate() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();

      const diff = target - now;

      if (diff <= 0) {
        setTime(null);
        return;
      }

      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    calculate();

    const timer = setInterval(calculate, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!time) {
    return (
      <div className="text-green-400 font-bold">
        LIVE
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <TimeBox value={time.days} label="D" />
      <TimeBox value={time.hours} label="H" />
      <TimeBox value={time.minutes} label="M" />
      <TimeBox value={time.seconds} label="S" />
    </div>
  );
}

function TimeBox({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-[#131A2A] px-3 py-2 text-center min-w-[52px]">
      <div className="text-lg font-bold">
        {String(value).padStart(2, "0")}
      </div>

      <div className="text-xs text-gray-500">
        {label}
      </div>
    </div>
  );
}