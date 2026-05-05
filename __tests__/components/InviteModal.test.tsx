import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteModal } from "@/components/business/InviteModal";

const defaultProps = {
  assessmentId: "assess-1",
  assessmentTitle: "Frontend Test",
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe("InviteModal", () => {
  it("renders when open", () => {
    render(<InviteModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Invite Candidates")).toBeInTheDocument();
  });

  it("has email textarea", () => {
    render(<InviteModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(/alice@example\.com/i),
    ).toBeInTheDocument();
  });

  it("has submit button", () => {
    render(<InviteModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /send invites/i })).toBeInTheDocument();
  });

  it("shows loading state on submit", async () => {
    const user = userEvent.setup();
    // Mock fetch to hang so we can see the loading state
    vi.stubGlobal("fetch", () => new Promise(() => {}));

    render(<InviteModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/alice@example\.com/i);
    await user.type(textarea, "test@example.com");

    const submitButton = screen.getByRole("button", { name: /send invites/i });
    await user.click(submitButton);

    expect(screen.getByRole("button", { name: /sending/i })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
