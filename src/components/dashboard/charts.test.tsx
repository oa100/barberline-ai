import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CallVolumeChart, PeakHoursChart } from "./charts";

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => {
  const MockResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  );
  const MockBarChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  );
  const MockLineChart = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  );
  const MockBar = () => <div data-testid="bar" />;
  const MockLine = () => <div data-testid="line" />;
  const Noop = () => null;

  return {
    ResponsiveContainer: MockResponsiveContainer,
    BarChart: MockBarChart,
    LineChart: MockLineChart,
    Bar: MockBar,
    Line: MockLine,
    XAxis: Noop,
    YAxis: Noop,
    CartesianGrid: Noop,
    Tooltip: Noop,
  };
});

const sampleCallVolumeData = [
  { date: "2026-02-20", total: 10, booked: 4 },
  { date: "2026-02-21", total: 15, booked: 7 },
  { date: "2026-02-22", total: 8, booked: 3 },
];

const samplePeakHoursData = [
  { hour: 9, count: 5 },
  { hour: 10, count: 12 },
  { hour: 14, count: 8 },
];

describe("CallVolumeChart", () => {
  it("renders without crashing with sample data", () => {
    render(<CallVolumeChart data={sampleCallVolumeData} />);
    expect(screen.getByText("Call Volume")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("handles empty data array", () => {
    render(<CallVolumeChart data={[]} />);
    expect(screen.getByText("Call Volume")).toBeInTheDocument();
  });
});

describe("PeakHoursChart", () => {
  it("renders without crashing with sample data", () => {
    render(<PeakHoursChart data={samplePeakHoursData} />);
    expect(screen.getByText("Peak Hours")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("handles empty data array", () => {
    render(<PeakHoursChart data={[]} />);
    expect(screen.getByText("Peak Hours")).toBeInTheDocument();
  });
});
