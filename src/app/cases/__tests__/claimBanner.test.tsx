import ClaimBanner from "@/app/cases/[id]/components/ClaimBanner";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ClaimBanner", () => {
  it("renders when show is true", () => {
    const { getByText } = render(<ClaimBanner show onDismiss={() => {}} />);
    expect(getByText(/claim this case/i)).toBeTruthy();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <ClaimBanner show={false} onDismiss={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
