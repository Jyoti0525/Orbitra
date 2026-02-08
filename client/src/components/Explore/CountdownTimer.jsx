import { useState, useEffect } from 'react';

export default function CountdownTimer({ approachDate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const approach = new Date(approachDate);
      const difference = approach - now;

      if (difference <= 0) {
        return { expired: true, label: 'Passed' };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, expired: false };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [approachDate]);

  if (!timeLeft) {
    return <span className="text-gray-400">Loading...</span>;
  }

  if (timeLeft.expired) {
    return <span className="text-gray-500">{timeLeft.label}</span>;
  }

  const formatTime = () => {
    const parts = [];

    if (timeLeft.days > 0) {
      parts.push(`${timeLeft.days}d`);
    }
    if (timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.hours}h`);
    }
    if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) {
      parts.push(`${timeLeft.minutes}m`);
    }

    // Always show seconds if under 1 hour
    if (timeLeft.days === 0 && timeLeft.hours === 0) {
      parts.push(`${timeLeft.seconds}s`);
    }

    return parts.join(' ');
  };

  return (
    <span className="text-star-blue font-mono">
      ⏱ {formatTime()}
    </span>
  );
}
