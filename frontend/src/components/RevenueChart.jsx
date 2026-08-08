// src/components/RevenueChart.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getDailyRevenue } from "../services/dashboardApi";
import { cacheStore } from "../utils/cacheStore.js";

const ACCENT = "#f97316"; // existing orange accent
const ACCENT_LIGHT = "#ffb347";

function formatShortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="admin-chart__tooltip">
      <p className="admin-chart__tooltip-date">{formatShortDate(label)}</p>
      <p className="admin-chart__tooltip-value">
        ₹{Number(payload[0].value || 0).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

export default function RevenueChart({ days = 30 }) {
  const cacheKey = useMemo(() => `dashboard-revenue:${days}`, [days]);
  const cached = cacheStore.get(cacheKey);
  const [data, setData] = useState(() => (cached ? cached.data : []));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => !cacheStore.get(cacheKey));

  useEffect(() => {
    let active = true;
    const cachedEntry = cacheStore.get(cacheKey);

    if (cachedEntry) {
      setData(Array.isArray(cachedEntry.data) ? cachedEntry.data : []);
      setError("");
      setLoading(false);
    } else {
      setLoading(true);
    }

    cacheStore
      .getOrFetch(cacheKey, async () => {
        const rows = await getDailyRevenue(days);
        return Array.isArray(rows) ? rows : [];
      }, 300000)
      .then((rows) => {
        if (active) {
          setData(rows);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message || "Could not load chart data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheKey, days]);

  const rangeLabel = useMemo(() => `Last ${days} days`, [days]);

  return (
    <motion.div
      className="admin-chart-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="admin-chart-card__header">
        <div>
          <h3 className="admin-chart-card__title">Revenue Overview</h3>
          <p className="admin-chart-card__subtitle">Daily revenue trend</p>
        </div>
        <span className="admin-chart-card__range">{rangeLabel}</span>
      </div>

      <div className="admin-chart-card__body">
        {loading ? (
          <div className="admin-chart__state">Loading chart…</div>
        ) : error ? (
          <div className="admin-chart__state admin-chart__state--error">
            {error}
          </div>
        ) : data.length === 0 ? (
          <div className="admin-chart__state">No revenue data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={ACCENT} />
                  <stop offset="100%" stopColor={ACCENT_LIGHT} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--admin-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fill: "var(--admin-text-dim)", fontSize: 12 }}
                axisLine={{ stroke: "var(--admin-border)" }}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "var(--admin-text-dim)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) =>
                  `₹${Number(v).toLocaleString("en-IN", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  })}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#revenueStroke)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}