import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChangeBadge } from "./Badge";

describe("ChangeBadge", () => {
  it("renders an up arrow and the percentage for a positive change", () => {
    render(<ChangeBadge value={1.234} />);
    expect(screen.getByLabelText("Up 1.23 percent")).toBeInTheDocument();
    expect(screen.getByText("1.23%")).toBeInTheDocument();
  });

  it("renders a down arrow with the absolute value for a negative change", () => {
    render(<ChangeBadge value={-2.5} />);
    expect(screen.getByLabelText("Down 2.50 percent")).toBeInTheDocument();
    expect(screen.getByText("2.50%")).toBeInTheDocument();
  });

  it("renders a neutral state for exactly zero", () => {
    render(<ChangeBadge value={0} />);
    expect(screen.getByLabelText("No change")).toBeInTheDocument();
    expect(screen.getByText("0.00%")).toBeInTheDocument();
  });

  it("renders a placeholder dash when the value is unknown", () => {
    render(<ChangeBadge value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
