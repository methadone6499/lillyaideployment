import type { ChartBlock } from "../../types";

const CHART_COLORS = [
  "var(--brand-emerald)",
  "#60a5fa",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#94a3b8",
] as const;

type ReportChartProps = {
  chart: ChartBlock;
};

type ChartScale = {
  minimum: number;
  maximum: number;
  ticks: number[];
};

function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function getCurrencyOptions(
  currency: string | undefined,
): Intl.NumberFormatOptions | null {
  if (!currency || !/^[A-Za-z]{3}$/.test(currency)) {
    return null;
  }

  return {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  };
}

function formatChartValue(
  value: number,
  currency: string | undefined,
  compact = false,
): string {
  const currencyOptions = getCurrencyOptions(currency);

  return new Intl.NumberFormat("en-US", {
    ...(currencyOptions ?? {}),
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
}

function createChartScale(values: number[]): ChartScale {
  const minimumValue = Math.min(0, ...values);
  const maximumValue = Math.max(0, ...values);
  const rawRange = Math.max(maximumValue - minimumValue, 1);
  const roughStep = rawRange / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const multiplier =
    normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;
  const step = Math.max(multiplier * magnitude, Number.EPSILON);
  const minimum = Math.floor(minimumValue / step) * step;
  let maximum = Math.ceil(maximumValue / step) * step;

  if (minimum === maximum) {
    maximum = minimum + step;
  }

  const tickCount = Math.min(8, Math.round((maximum - minimum) / step));
  const ticks = Array.from(
    { length: tickCount + 1 },
    (_, index) => minimum + index * step,
  );

  return { minimum, maximum, ticks };
}

function getChartValues(chart: ChartBlock): number[] {
  return chart.series.flatMap((series) => series.values);
}

function shortenLabel(label: string, maxLength = 18): string {
  return label.length > maxLength
    ? `${label.slice(0, Math.max(1, maxLength - 1))}…`
    : label;
}

function ChartLegend({ chart }: ReportChartProps) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-helper text-text-muted">
      {chart.series.map((series, index) => (
        <span key={`${series.name}-${index}`} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: getChartColor(index) }}
          />
          {series.name}
        </span>
      ))}
    </div>
  );
}

function ChartDataTable({ chart }: ReportChartProps) {
  return (
    <table className="sr-only">
      <caption>{chart.title} data</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          {chart.series.map((series, index) => (
            <th key={`${series.name}-${index}`} scope="col">
              {series.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chart.categories.map((category, categoryIndex) => (
          <tr key={`${category}-${categoryIndex}`}>
            <th scope="row">{category}</th>
            {chart.series.map((series, seriesIndex) => {
              const value = series.values[categoryIndex];
              return (
                <td key={`${series.name}-${seriesIndex}`}>
                  {value === undefined
                    ? "Not available"
                    : formatChartValue(value, chart.currency)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VerticalAxis({
  scale,
  chart,
  plotLeft,
  plotRight,
  plotTop,
  plotBottom,
}: {
  scale: ChartScale;
  chart: ChartBlock;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}) {
  const range = scale.maximum - scale.minimum;
  const yForValue = (value: number) =>
    plotTop + ((scale.maximum - value) / range) * (plotBottom - plotTop);

  return (
    <g aria-hidden="true">
      {scale.ticks.map((tick) => {
        const y = yForValue(tick);
        return (
          <g key={tick}>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={y}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />
            <text
              x={plotLeft - 10}
              y={y + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="11"
            >
              {formatChartValue(tick, chart.currency, true)}
            </text>
          </g>
        );
      })}
      <line
        x1={plotLeft}
        x2={plotRight}
        y1={yForValue(0)}
        y2={yForValue(0)}
        stroke="var(--text-muted)"
        strokeWidth="1"
      />
    </g>
  );
}

function BarChart({ chart }: ReportChartProps) {
  const width = Math.max(720, chart.categories.length * 120);
  const height = 330;
  const plotLeft = 86;
  const plotRight = width - 24;
  const plotTop = 12;
  const plotBottom = height - 58;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const scale = createChartScale(getChartValues(chart));
  const range = scale.maximum - scale.minimum;
  const yForValue = (value: number) =>
    plotTop + ((scale.maximum - value) / range) * plotHeight;
  const zeroY = yForValue(0);
  const categoryWidth = plotWidth / Math.max(chart.categories.length, 1);
  const groupWidth = categoryWidth * 0.72;
  const barGap = 5;
  const barWidth = Math.max(
    4,
    Math.min(46, (groupWidth - barGap * Math.max(chart.series.length - 1, 0)) / Math.max(chart.series.length, 1)),
  );

  return (
    <div className="overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto"
        style={{ width }}
        role="img"
        aria-label={`${chart.title}, grouped bar chart`}
      >
        <title>{chart.title}</title>
        <desc>Values are grouped by category and series.</desc>
        <VerticalAxis
          scale={scale}
          chart={chart}
          plotLeft={plotLeft}
          plotRight={plotRight}
          plotTop={plotTop}
          plotBottom={plotBottom}
        />
        {chart.categories.map((category, categoryIndex) => {
          const categoryCenter = plotLeft + categoryWidth * (categoryIndex + 0.5);
          const usedWidth =
            chart.series.length * barWidth +
            Math.max(chart.series.length - 1, 0) * barGap;

          return (
            <g key={`${category}-${categoryIndex}`}>
              {chart.series.map((series, seriesIndex) => {
                const value = series.values[categoryIndex];
                if (value === undefined) return null;
                const y = yForValue(value);
                const x =
                  categoryCenter - usedWidth / 2 + seriesIndex * (barWidth + barGap);

                return (
                  <rect
                    key={`${series.name}-${seriesIndex}`}
                    x={x}
                    y={Math.min(y, zeroY)}
                    width={barWidth}
                    height={Math.max(1, Math.abs(zeroY - y))}
                    rx="3"
                    fill={getChartColor(seriesIndex)}
                  >
                    <title>
                      {category}, {series.name}: {formatChartValue(value, chart.currency)}
                    </title>
                  </rect>
                );
              })}
              <text
                x={categoryCenter}
                y={height - 26}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="11"
              >
                <title>{category}</title>
                {shortenLabel(category)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function LineChart({ chart }: ReportChartProps) {
  const width = Math.max(720, chart.categories.length * 120);
  const height = 330;
  const plotLeft = 86;
  const plotRight = width - 24;
  const plotTop = 12;
  const plotBottom = height - 58;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const scale = createChartScale(getChartValues(chart));
  const range = scale.maximum - scale.minimum;
  const yForValue = (value: number) =>
    plotTop + ((scale.maximum - value) / range) * plotHeight;
  const xForIndex = (index: number) =>
    chart.categories.length <= 1
      ? plotLeft + plotWidth / 2
      : plotLeft + (index / (chart.categories.length - 1)) * plotWidth;

  return (
    <div className="overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto"
        style={{ width }}
        role="img"
        aria-label={`${chart.title}, line chart`}
      >
        <title>{chart.title}</title>
        <desc>Series values are plotted across the supplied categories.</desc>
        <VerticalAxis
          scale={scale}
          chart={chart}
          plotLeft={plotLeft}
          plotRight={plotRight}
          plotTop={plotTop}
          plotBottom={plotBottom}
        />
        {chart.categories.map((category, index) => {
          const x = xForIndex(index);
          return (
            <g key={`${category}-${index}`} aria-hidden="true">
              <line
                x1={x}
                x2={x}
                y1={plotTop}
                y2={plotBottom}
                stroke="var(--border-subtle)"
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - 26}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="11"
              >
                <title>{category}</title>
                {shortenLabel(category)}
              </text>
            </g>
          );
        })}
        {chart.series.map((series, seriesIndex) => {
          const points = chart.categories
            .map((_, categoryIndex) => {
              const value = series.values[categoryIndex];
              return value === undefined
                ? null
                : `${xForIndex(categoryIndex)},${yForValue(value)}`;
            })
            .filter((point): point is string => point !== null)
            .join(" ");

          return (
            <g key={`${series.name}-${seriesIndex}`}>
              <polyline
                points={points}
                fill="none"
                stroke={getChartColor(seriesIndex)}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {chart.categories.map((category, categoryIndex) => {
                const value = series.values[categoryIndex];
                if (value === undefined) return null;
                return (
                  <circle
                    key={`${category}-${categoryIndex}`}
                    cx={xForIndex(categoryIndex)}
                    cy={yForValue(value)}
                    r="4"
                    fill="var(--base-black)"
                    stroke={getChartColor(seriesIndex)}
                    strokeWidth="2.5"
                  >
                    <title>
                      {category}, {series.name}: {formatChartValue(value, chart.currency)}
                    </title>
                  </circle>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DoughnutChart({ chart }: ReportChartProps) {
  const series = chart.series[0];
  const values = chart.categories.map((category, index) => ({
    category,
    value: Math.max(0, series?.values[index] ?? 0),
  }));
  const total = values.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const slices = values.map((item, index) => {
    const start = cursor;
    cursor += total > 0 ? (item.value / total) * 100 : 0;
    return `${getChartColor(index)} ${start}% ${cursor}%`;
  });
  const background =
    total > 0
      ? `conic-gradient(${slices.join(", ")})`
      : "conic-gradient(var(--surface-elevated) 0 100%)";

  return (
    <div className="grid items-center gap-7 py-2 sm:grid-cols-[200px_minmax(0,1fr)]">
      <div
        className="relative mx-auto size-48 rounded-full"
        style={{ background }}
        role="img"
        aria-label={`${chart.title}, doughnut chart`}
      >
        <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full border border-border-default bg-base-black px-2 text-center">
          <span className="text-helper text-text-muted">Total</span>
          <span className="mt-1 text-label font-medium text-text-heading">
            {formatChartValue(total, chart.currency, true)}
          </span>
        </div>
      </div>
      <div className="grid gap-2.5">
        {values.map((item, index) => (
          <div
            key={`${item.category}-${index}`}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-5 text-helper"
          >
            <span className="flex min-w-0 items-center gap-2 text-text-body">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: getChartColor(index) }}
              />
              <span className="truncate" title={item.category}>
                {item.category}
              </span>
            </span>
            <span className="font-medium tabular-nums text-text-heading">
              {formatChartValue(item.value, chart.currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TornadoChart({ chart }: ReportChartProps) {
  const width = 820;
  const rowHeight = 44;
  const height = Math.max(250, chart.categories.length * rowHeight + 54);
  const plotLeft = 198;
  const plotRight = width - 34;
  const plotTop = 18;
  const plotBottom = height - 36;
  const plotWidth = plotRight - plotLeft;
  const scale = createChartScale(getChartValues(chart));
  const range = scale.maximum - scale.minimum;
  const xForValue = (value: number) =>
    plotLeft + ((value - scale.minimum) / range) * plotWidth;

  return (
    <div className="overflow-x-auto pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto min-w-[720px] w-full"
        role="img"
        aria-label={`${chart.title}, sensitivity range chart`}
      >
        <title>{chart.title}</title>
        <desc>Low and high sensitivity values are connected for each parameter.</desc>
        {scale.ticks.map((tick) => {
          const x = xForValue(tick);
          return (
            <g key={tick} aria-hidden="true">
              <line
                x1={x}
                x2={x}
                y1={plotTop}
                y2={plotBottom}
                stroke={tick === 0 ? "var(--text-muted)" : "var(--border-subtle)"}
                strokeWidth="1"
              />
              <text
                x={x}
                y={height - 12}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="11"
              >
                {formatChartValue(tick, chart.currency, true)}
              </text>
            </g>
          );
        })}
        {chart.categories.map((category, categoryIndex) => {
          const y = plotTop + rowHeight * categoryIndex + rowHeight / 2;
          const firstValue = chart.series[0]?.values[categoryIndex];
          const secondValue = chart.series[1]?.values[categoryIndex];
          const presentValues = [firstValue, secondValue].filter(
            (value): value is number => value !== undefined,
          );
          if (presentValues.length === 0) return null;
          const startValue =
            presentValues.length === 1
              ? Math.min(presentValues[0], 0)
              : Math.min(...presentValues);
          const endValue =
            presentValues.length === 1
              ? Math.max(presentValues[0], 0)
              : Math.max(...presentValues);

          return (
            <g key={`${category}-${categoryIndex}`}>
              <text
                x={plotLeft - 14}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-body)"
                fontSize="11"
              >
                <title>{category}</title>
                {shortenLabel(category, 27)}
              </text>
              <line
                x1={xForValue(startValue)}
                x2={xForValue(endValue)}
                y1={y}
                y2={y}
                stroke="var(--border-default)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {presentValues.map((value, seriesIndex) => (
                <circle
                  key={`${value}-${seriesIndex}`}
                  cx={xForValue(value)}
                  cy={y}
                  r="5"
                  fill={getChartColor(seriesIndex)}
                >
                  <title>
                    {category}, {chart.series[seriesIndex]?.name}: {formatChartValue(value, chart.currency)}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ChartBody({ chart }: ReportChartProps) {
  switch (chart.chart_type.toLowerCase()) {
    case "bar":
      return <BarChart chart={chart} />;
    case "line":
      return <LineChart chart={chart} />;
    case "doughnut":
    case "donut":
      return <DoughnutChart chart={chart} />;
    case "tornado":
      return <TornadoChart chart={chart} />;
    default:
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-helper text-text-body">
            <thead>
              <tr className="border-b border-border-default">
                <th className="px-3 py-2 font-medium text-text-heading">Category</th>
                {chart.series.map((series, index) => (
                  <th
                    key={`${series.name}-${index}`}
                    className="px-3 py-2 font-medium text-text-heading"
                  >
                    {series.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.categories.map((category, categoryIndex) => (
                <tr key={`${category}-${categoryIndex}`} className="border-b border-border-subtle last:border-0">
                  <th className="px-3 py-2 font-medium text-text-heading" scope="row">
                    {category}
                  </th>
                  {chart.series.map((series, seriesIndex) => {
                    const value = series.values[categoryIndex];
                    return (
                      <td key={`${series.name}-${seriesIndex}`} className="px-3 py-2 tabular-nums">
                        {value === undefined
                          ? "—"
                          : formatChartValue(value, chart.currency)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function ReportChart({ chart }: ReportChartProps) {
  const hasData =
    chart.categories.length > 0 &&
    chart.series.some((series) => series.values.length > 0);

  return (
    <figure className="rounded-card border border-border-default bg-surface-subtle p-4 sm:p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-label font-medium text-text-heading">{chart.title}</span>
        {chart.currency ? (
          <span className="text-helper uppercase tracking-[0.08em] text-text-muted">
            {chart.currency}
          </span>
        ) : null}
      </figcaption>
      {hasData ? (
        <div className="mt-5 space-y-5">
          {chart.chart_type.toLowerCase() !== "doughnut" &&
          chart.chart_type.toLowerCase() !== "donut" ? (
            <ChartLegend chart={chart} />
          ) : null}
          <ChartBody chart={chart} />
          <ChartDataTable chart={chart} />
        </div>
      ) : (
        <p className="mt-4 text-body-lg text-text-muted">No chart data is available.</p>
      )}
    </figure>
  );
}
