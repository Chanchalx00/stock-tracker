"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import {
  createChart,
  createSeriesMarkers,
  createTextWatermark,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  BarSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type UTCTimestamp,
  type Time,
} from "lightweight-charts";
import type { OhlcPoint } from "@/components/PriceChart";
import { formatVolume, displaySymbol } from "@/lib/utils";

export type ChartType = "candlestick" | "line" | "area" | "bar";

export interface IndicatorsState {
  volume: boolean;
  ma20: boolean;
  ma50: boolean;
  ema20: boolean;
}

export interface CandlestickChartRef {
  resetZoom: () => void;
}

interface CandlestickChartProps {
  points: OhlcPoint[];
  symbol: string;
  height?: number;
  chartType?: ChartType;
  indicators?: IndicatorsState;
  range?: string;
}

export interface Bar {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const UP_COLOR = "#26a69a";
const DOWN_COLOR = "#ef5350";
const UP_COLOR_FADED = "rgba(38, 166, 154, 0.4)";
const DOWN_COLOR_FADED = "rgba(239, 83, 80, 0.4)";
const BACKGROUND = "#131722";
const GRID_COLOR = "#1e222d";
const TEXT_COLOR = "#787b86";

function formatTimeLabel(time: number, range: string): string {
  const isIntraday = range === "1d" || range === "5d";
  const date = new Date(time * 1000);
  if (isIntraday) {
    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

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

function calculateSMA(bars: Bar[], period: number) {
  const result: { time: UTCTimestamp; value: number }[] = [];
  if (bars.length < period) return result;
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close;
    if (i >= period) {
      sum -= bars[i - period].close;
    }
    if (i >= period - 1) {
      result.push({ time: bars[i].time, value: +(sum / period).toFixed(2) });
    }
  }
  return result;
}

function calculateEMA(bars: Bar[], period: number) {
  const result: { time: UTCTimestamp; value: number }[] = [];
  if (bars.length < period) return result;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += bars[i].close;
  }
  let ema = sum / period;
  result.push({ time: bars[period - 1].time, value: +ema.toFixed(2) });
  for (let i = period; i < bars.length; i++) {
    ema = bars[i].close * k + ema * (1 - k);
    result.push({ time: bars[i].time, value: +ema.toFixed(2) });
  }
  return result;
}

const CandlestickChart = forwardRef<CandlestickChartRef, CandlestickChartProps>(
  (
    {
      points,
      symbol,
      height = 520,
      chartType = "candlestick",
      indicators = { volume: true, ma20: false, ma50: false, ema20: false },
      range = "1y",
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seriesRef = useRef<ISeriesApi<any> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const ma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ma50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

    const [legendBar, setLegendBar] = useState<Bar | null>(null);
    const dataRef = useRef<Bar[]>([]);

    useImperativeHandle(ref, () => ({
      resetZoom: () => {
        chartRef.current?.timeScale().fitContent();
      },
    }));

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
          scaleMargins: { top: 0.08, bottom: indicators.volume ? 0.22 : 0.08 },
        },
        leftPriceScale: {
          visible: false,
        },
        timeScale: {
          visible: true,
          borderColor: GRID_COLOR,
          timeVisible: true,
          secondsVisible: range === "1d",
          tickMarkFormatter: (time: number) => formatTimeLabel(time, range),
        },
        localization: {
          timeFormatter: (time: number) => formatTimeLabel(time, range),
        },
        crosshair: {
          vertLine: { visible: true, labelVisible: true, color: "#758696" },
          horzLine: { visible: true, labelVisible: true, color: "#758696" },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: { time: true, price: true },
          mouseWheel: true,
          pinch: true,
        },
        kineticScroll: {
          touch: true,
          mouse: true,
        },
      });

      chartRef.current = chart;

      createTextWatermark(chart.panes()[0], {
        visible: true,
        horzAlign: "center",
        vertAlign: "center",
        lines: [
          {
            text: displaySymbol(symbol),
            color: "rgba(255, 255, 255, 0.05)",
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
        ma20SeriesRef.current = null;
        ma50SeriesRef.current = null;
        ema20SeriesRef.current = null;
        markersRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height, symbol, range]);

    // Re-create price & indicator series when chartType, indicators, or points change
    useEffect(() => {
      const chart = chartRef.current;
      if (!chart) return;

      // Remove existing main series if type changed
      if (seriesRef.current) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }
      if (ma20SeriesRef.current) {
        chart.removeSeries(ma20SeriesRef.current);
        ma20SeriesRef.current = null;
      }
      if (ma50SeriesRef.current) {
        chart.removeSeries(ma50SeriesRef.current);
        ma50SeriesRef.current = null;
      }
      if (ema20SeriesRef.current) {
        chart.removeSeries(ema20SeriesRef.current);
        ema20SeriesRef.current = null;
      }

      if (!points.length) return;

      const data = toSeriesData(points);
      dataRef.current = data;

      // Add main series
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mainSeries: ISeriesApi<any>;
      switch (chartType) {
        case "line":
          mainSeries = chart.addSeries(LineSeries, {
            color: "#2962FF",
            lineWidth: 2,
            priceLineVisible: true,
            lastValueVisible: true,
          });
          mainSeries.setData(data.map((d) => ({ time: d.time, value: d.close })));
          break;
        case "area":
          mainSeries = chart.addSeries(AreaSeries, {
            lineColor: "#2962FF",
            topColor: "rgba(41, 98, 255, 0.4)",
            bottomColor: "rgba(41, 98, 255, 0.0)",
            lineWidth: 2,
            priceLineVisible: true,
            lastValueVisible: true,
          });
          mainSeries.setData(data.map((d) => ({ time: d.time, value: d.close })));
          break;
        case "bar":
          mainSeries = chart.addSeries(BarSeries, {
            upColor: UP_COLOR,
            downColor: DOWN_COLOR,
            priceLineVisible: true,
            lastValueVisible: true,
          });
          mainSeries.setData(data);
          break;
        case "candlestick":
        default:
          mainSeries = chart.addSeries(CandlestickSeries, {
            upColor: UP_COLOR,
            downColor: DOWN_COLOR,
            borderUpColor: UP_COLOR,
            borderDownColor: DOWN_COLOR,
            wickUpColor: UP_COLOR,
            wickDownColor: DOWN_COLOR,
            priceLineVisible: true,
            lastValueVisible: true,
          });
          mainSeries.setData(data);
          break;
      }
      seriesRef.current = mainSeries;
      markersRef.current = createSeriesMarkers(mainSeries, []);

      // Add Volume Series if enabled
      if (indicators.volume) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
          lastValueVisible: false,
          priceLineVisible: false,
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.78, bottom: 0 },
        });
        volumeSeries.setData(
          data.map((bar) => ({
            time: bar.time,
            value: bar.volume,
            color: bar.close >= bar.open ? UP_COLOR_FADED : DOWN_COLOR_FADED,
          })),
        );
        volumeSeriesRef.current = volumeSeries;
      }

      // Add MA 20
      if (indicators.ma20) {
        const ma20Data = calculateSMA(data, 20);
        if (ma20Data.length) {
          const ma20Series = chart.addSeries(LineSeries, {
            color: "#00E5FF",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: "MA 20",
          });
          ma20Series.setData(ma20Data);
          ma20SeriesRef.current = ma20Series;
        }
      }

      // Add MA 50
      if (indicators.ma50) {
        const ma50Data = calculateSMA(data, 50);
        if (ma50Data.length) {
          const ma50Series = chart.addSeries(LineSeries, {
            color: "#FF9100",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: "MA 50",
          });
          ma50Series.setData(ma50Data);
          ma50SeriesRef.current = ma50Series;
        }
      }

      // Add EMA 20
      if (indicators.ema20) {
        const ema20Data = calculateEMA(data, 20);
        if (ema20Data.length) {
          const ema20Series = chart.addSeries(LineSeries, {
            color: "#E040FB",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: true,
            title: "EMA 20",
          });
          ema20Series.setData(ema20Data);
          ema20SeriesRef.current = ema20Series;
        }
      }

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

      chart.timeScale().fitContent();
    }, [points, chartType, indicators]);

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
            className="absolute top-2 left-2 z-10 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md text-[11px] font-mono border border-gray-800 pointer-events-none"
            style={{ color: TEXT_COLOR }}
          >
            <span className="font-bold text-white text-xs font-sans">
              {displaySymbol(symbol)}
            </span>
            <span>
              O<span className="text-gray-200 ml-0.5">{displayBar.open.toFixed(2)}</span>
            </span>
            <span>
              H<span className="text-gray-200 ml-0.5">{displayBar.high.toFixed(2)}</span>
            </span>
            <span>
              L<span className="text-gray-200 ml-0.5">{displayBar.low.toFixed(2)}</span>
            </span>
            <span>
              C<span className="text-gray-200 ml-0.5">{displayBar.close.toFixed(2)}</span>
            </span>
            <span
              className="font-semibold"
              style={{ color: barPositive ? UP_COLOR : DOWN_COLOR }}
            >
              {barPositive ? "+" : ""}
              {barChangePct.toFixed(2)}%
            </span>
            {indicators.volume && (
              <span>
                Vol<span className="text-gray-200 ml-0.5">{formatVolume(displayBar.volume)}</span>
              </span>
            )}
            {indicators.ma20 && (
              <span className="text-[#00E5FF]">MA20</span>
            )}
            {indicators.ma50 && (
              <span className="text-[#FF9100]">MA50</span>
            )}
            {indicators.ema20 && (
              <span className="text-[#E040FB]">EMA20</span>
            )}
          </div>
        )}
        <div ref={containerRef} className="w-full cursor-crosshair" />
      </div>
    );
  },
);

CandlestickChart.displayName = "CandlestickChart";

export default CandlestickChart;
