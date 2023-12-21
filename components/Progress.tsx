import { useState, useEffect, useRef } from 'react';

export default function Progress({ expectedTime }: { expectedTime: number }) {
  const [p, setP] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      const nextP =
        1 - Math.exp(-2 * ((Date.now() - startTime.current) / expectedTime));
      setP(nextP);
    }, 16);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <svg
      className="-mb-0.5 lg:-mb-1 mr-1 lg:mr-3 h4 lg:h-8 w-4 lg:w-8 text-gray-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <circle
        className="opacity-75 -rotate-90 origin-center"
        cx="12"
        cy="12"
        r="10"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="400,400"
        strokeDashoffset={`calc(400 - (400 * ${p * 16}) / 100)`}
      ></circle>
    </svg>
  );
}
