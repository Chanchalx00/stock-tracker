"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  createTextWatermark,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import type { OhlcPoint } from "@/components/PriceChart";
import { formatVolume, displaySymbol } from "@/lib/utils";

interface CandlestickChartProps {
  points: OhlcPoint[];
  symbol: string;
  height?: number;
}

interface Bar {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

// lightweight-charts requires strictly ascending, unique times.
function toSeriesData(points: OhlcPoint[]): Bar[] {
  const bySecond = new Map<number, OhlcPoint>();
  for (const p of points) {
    bySecond.set(Math.floor(p.time / 1000), p);
  }
  return [...bySecond.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([time, p]) => ({
      time: time as UTCTimestamp,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume ?? 0,
    }));
}

// TradingView's own default candlestick palette and dark theme tokens —
// lightweight-charts is TradingView's library, so matching these makes
// this chart look like an actual TradingView embed rather than reusing
// this app's emerald/red brand colors.
const UP_COLOR = "#26a69a";
const DOWN_COLOR = "#ef5350";
const UP_COLOR_FADED = "rgba(38, 166, 154, 0.5)";
const DOWN_COLOR_FADED = "rgba(239, 83, 80, 0.5)";
const BACKGROUND = "#131722";
const GRID_COLOR = "#1e222d";
const TEXT_COLOR = "#787b86";

export default function CandlestickChart({
  points,
  symbol,
  height = 460,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const [legendBar, setLegendBar] = useState<Bar | null>(null);
  const dataRef = useRef<Bar[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: BACKGROUND },
        textColor: TEXT_COLOR,
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      rightPriceScale: {
        visible: true,
        borderColor: GRID_COLOR,
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: true,
        borderColor: GRID_COLOR,
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: number) => formatIST(time),
      },
      localization: {
        timeFormatter: (time: number) => formatIST(time),
      },
      crosshair: {
        vertLine: { visible: true, labelVisible: true, color: "#758696" },
        horzLine: { visible: true, labelVisible: true, color: "#758696" },
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
      priceLineVisible: true,
      lastValueVisible: true,
    });
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    createTextWatermark(chart.panes()[0], {
      visible: true,
      horzAlign: "center",
      vertAlign: "center",
      lines: [
        {
          text: displaySymbol(symbol),
          color: "rgba(255, 255, 255, 0.06)",
          fontSize: 64,
        },
      ],
    });

    const handleCrosshairMove = (
      param: Parameters<Parameters<IChartApi["subscribeCrosshairMove"]>[0]>[0],
    ) => {
      const found = param.time
        ? dataRef.current.find((d) => d.time === param.time)
        : null;
      setLegendBar(found ?? null);
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, symbol]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !points.length) return;

    const data = toSeriesData(points);
    series.setData(data);
    dataRef.current = data;

    volumeSeriesRef.current?.setData(
      data.map((bar) => ({
        time: bar.time,
        value: bar.volume,
        color: bar.close >= bar.open ? UP_COLOR_FADED : DOWN_COLOR_FADED,
      })),
    );

    const last = data[data.length - 1];
    setLegendBar(last);
    markersRef.current?.setMarkers([
      {
        time: last.time,
        position: "aboveBar",
        shape: "circle",
        color: last.close >= last.open ? UP_COLOR : DOWN_COLOR,
        size: 1,
      },
    ]);

    chartRef.current?.timeScale().fitContent();
  }, [points]);

  const displayBar = legendBar ?? dataRef.current[dataRef.current.length - 1] ?? null;
  const barPositive = displayBar ? displayBar.close >= displayBar.open : true;
  const barChangePct =
    displayBar && displayBar.open
      ? ((displayBar.close - displayBar.open) / displayBar.open) * 100
      : 0;

  return (
    <div className="relative w-full">
      {displayBar && (
        <div
          className="absolute top-2 left-2 z-10 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-2 py-1 rounded-md bg-black/30 backdrop-blur-sm text-[11px] font-mono pointer-events-none"
          style={{ color: TEXT_COLOR }}
        >
          <span className="font-bold text-white text-xs font-sans">
            {displaySymbol(symbol)}
          </span>
          <span>
            O<span className="text-gray-300 ml-0.5">{displayBar.open.toFixed(2)}</span>
          </span>
          <span>
            H<span className="text-gray-300 ml-0.5">{displayBar.high.toFixed(2)}</span>
          </span>
          <span>
            L<span className="text-gray-300 ml-0.5">{displayBar.low.toFixed(2)}</span>
          </span>
          <span>
            C<span className="text-gray-300 ml-0.5">{displayBar.close.toFixed(2)}</span>
          </span>
          <span
            className="font-semibold"
            style={{ color: barPositive ? UP_COLOR : DOWN_COLOR }}
          >
            {barPositive ? "+" : ""}
            {barChangePct.toFixed(2)}%
          </span>
          <span>
            Vol<span className="text-gray-300 ml-0.5">{formatVolume(displayBar.volume)}</span>
          </span>
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
