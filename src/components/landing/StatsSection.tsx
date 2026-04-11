"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./StatsSection.module.css";

function useCounter(target: number, duration = 2000, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, started]);
  return count;
}

const stats = [
  { label: "Happy Clients", value: 500, suffix: "+" },
  { label: "Orders Completed", value: 12000, suffix: "+" },
  { label: "Designs Created", value: 8500, suffix: "+" },
  { label: "Cities Served", value: 40, suffix: "+" },
];

export default function StatsSection() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const counts = stats.map(s => useCounter(s.value, 2000, started)); // eslint-disable-line

  return (
    <section className={styles.section} ref={ref}>
      <div className="container">
        <div className={styles.grid}>
          {stats.map((s, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.num}>
                {counts[i].toLocaleString()}<span>{s.suffix}</span>
              </div>
              <div className={styles.label}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
