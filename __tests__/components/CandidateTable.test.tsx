import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateTable, type CandidateInvite } from "@/components/business/CandidateTable";

const mockAssessments = [
  { id: "assess-1", title: "Frontend Test" },
  { id: "assess-2", title: "Backend Test" },
];

const mockInvites: CandidateInvite[] = [
  {
    id: "inv-1",
    candidateEmail: "alice@example.com",
    status: "PENDING",
    startedAt: null,
    completedAt: null,
    assessment: { id: "assess-1", title: "Frontend Test" },
  },
  {
    id: "inv-2",
    candidateEmail: "bob@example.com",
    status: "COMPLETED",
    startedAt: "2024-01-01T00:00:00Z",
    completedAt: "2024-01-02T00:00:00Z",
    assessment: { id: "assess-2", title: "Backend Test" },
  },
];

describe("CandidateTable", () => {
  it("renders table headers", () => {
    render(<CandidateTable invites={mockInvites} assessments={mockAssessments} />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Assessment")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders candidate rows with email", () => {
    render(<CandidateTable invites={mockInvites} assessments={mockAssessments} />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("status filter dropdown shows options", () => {
    render(<CandidateTable invites={mockInvites} assessments={mockAssessments} />);
    const statusFilter = screen.getByRole("combobox", { name: /filter by status/i });
    expect(statusFilter).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PENDING" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "COMPLETED" })).toBeInTheDocument();
  });

  it("filtering by status shows only matching rows", async () => {
    const user = userEvent.setup();
    render(<CandidateTable invites={mockInvites} assessments={mockAssessments} />);
    const statusFilter = screen.getByRole("combobox", { name: /filter by status/i });
    await user.selectOptions(statusFilter, "PENDING");
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.queryByText("bob@example.com")).not.toBeInTheDocument();
  });
});
