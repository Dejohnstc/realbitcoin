"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: string | Date;
}

export default function Countdown({ targetDate }: Props) {
  const calculate = () => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();

    const diff = target - now;

    if (diff <= 0) {
      return {
        expired: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      expired: false,
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [time, setTime] = useState(calculate());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculate());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (time.expired) {
    return (
      <span className="text-green-400 font-semibold">
        LIVE
      </span>
    );
  }

  return (
    <div className="flex gap-2 text-xs mt-2">

      <Box value={time.days} label="D" />

      <Box value={time.hours} label="H" />

      <Box value={time.minutes} label="M" />

      <Box value={time.seconds} label="S" />

    </div>
  );
}

function Box({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="bg-[#0B0F19] rounded-lg px-2 py-1 text-center">

      <div className="font-bold">
        {String(value).padStart(2, "0")}
      </div>

      <div className="text-gray-500 text-[10px]">
        {label}
      </div>

    </div>
  );
}