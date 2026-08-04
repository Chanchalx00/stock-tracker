"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";

export interface OhlcPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  points: OhlcPoint[];
  positive: boolean;
  height?: number;
}

// lightweight-charts formats timestamps in UTC by default, not the
// viewer's local time — for IST (UTC+5:30) that shows a time 5.5 hours
// behind the real one. Force Asia/Kolkata explicitly so the axis and
// crosshair always read as actual Indian market time.
function formatIST(time: number): string {
  return new Date(time * 1000).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// lightweight-charts requires strictly ascending, unique times. Round to
// whole seconds and keep the latest bar for any that collide, as a
// defensive floor — the real dedup for live data happens upstream, where
// ticks are bucketed to match the historical series' own interval.
function toSeriesData(points: OhlcPoint[]) {
  const bySecond = new Map<number, number>();
  for (const p of points) {
    bySecond.set(Math.floor(p.time / 1000), p.close);
  }
  return [...bySecond.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}

export default function PriceChart({
  points,
  positive,
  height = 130,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
        fontSize: 10,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
      },
      leftPriceScale: {
        visible: true,
        borderVisible: false,
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: number) => formatIST(time),
      },
      localization: {
        timeFormatter: (time: number) => formatIST(time),
      },
      crosshair: {
        vertLine: { visible: true, labelVisible: true },
        horzLine: { visible: true, labelVisible: true },
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
      markersRef.current = null;
    }

    const color = positive ? "#34d399" : "#f87171";
    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: `${color}33`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      pointMarkersVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    const data = toSeriesData(points);
    if (data.length) {
      series.setData(data);
      const last = data[data.length - 1];
      markersRef.current.setMarkers([
        {
          time: last.time,
          position: "inBar",
          shape: "circle",
          color,
          size: 1,
        },
      ]);
      chart.timeScale().fitContent();
    }
  }, [positive]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !points.length) return;

    const data = toSeriesData(points);
    series.setData(data);

    const last = data[data.length - 1];
    markersRef.current?.setMarkers([
      {
        time: last.time,
        position: "inBar",
        shape: "circle",
        color: positive ? "#34d399" : "#f87171",
        size: 1,
      },
    ]);

    chartRef.current?.timeScale().fitContent();
  }, [points, positive]);

  return <div ref={containerRef} className="w-full" />;
}
