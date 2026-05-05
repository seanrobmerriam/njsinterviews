import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "@/components/problems/DifficultyBadge";

vi.mock("@prisma/client", () => ({ Difficulty: {} }));

describe("DifficultyBadge", () => {
  it('renders "Easy" text for EASY difficulty', () => {
    render(<DifficultyBadge difficulty="EASY" />);
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it('renders "Medium" text for MEDIUM difficulty', () => {
    render(<DifficultyBadge difficulty="MEDIUM" />);
    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it('renders "Hard" text for HARD difficulty', () => {
    render(<DifficultyBadge difficulty="HARD" />);
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("has correct CSS class for EASY (contains emerald)", () => {
    const { container } = render(<DifficultyBadge difficulty="EASY" />);
    expect(container.firstChild).toHaveClass("bg-emerald-100");
  });

  it("has correct CSS class for HARD (contains red)", () => {
    const { container } = render(<DifficultyBadge difficulty="HARD" />);
    expect(container.firstChild).toHaveClass("bg-red-100");
  });

  it("accepts and applies extra className", () => {
    const { container } = render(<DifficultyBadge difficulty="EASY" className="test-class" />);
    expect(container.firstChild).toHaveClass("test-class");
  });
});
