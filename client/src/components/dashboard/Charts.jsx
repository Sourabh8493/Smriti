import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import "./dashboard.css";

export function ScoreTrendChart({ data }) {
  return (
    <div className="card chart-card">
      <div className="chart-card__head">
        <h3>Accuracy trend</h3>
        <p>Last 7 days, across all games</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#dbe3d8" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#5c6c61" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#5c6c61" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #dbe3d8", fontSize: 13 }}
            formatter={(value) => [`${value}%`, "Accuracy"]}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#2f5d50"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#2f5d50" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GameAccuracyChart({ data }) {
  return (
    <div className="card chart-card">
      <div className="chart-card__head">
        <h3>Accuracy by game</h3>
        <p>Average over the last 7 days</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#dbe3d8" vertical={false} />
          <XAxis dataKey="game" tick={{ fontSize: 12, fill: "#5c6c61" }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#5c6c61" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #dbe3d8", fontSize: 13 }}
            formatter={(value) => [`${value}%`, "Accuracy"]}
          />
          <Bar dataKey="accuracy" fill="#c68a2e" radius={[6, 6, 0, 0]} maxBarSize={46} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
