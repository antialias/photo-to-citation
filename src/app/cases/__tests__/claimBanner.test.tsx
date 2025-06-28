import ClaimBanner from "@/app/cases/[id]/components/ClaimBanner";
import I18nProvider from "@/app/i18n-provider";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ClaimBanner", () => {
  it("renders when show is true", () => {
    const { getByText } = render(
      <I18nProvider lang="en">
        <ClaimBanner show onDismiss={() => {}} />
      </I18nProvider>,
    );
    expect(getByText(/claim this case/i)).toBeTruthy();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <I18nProvider lang="en">
        <ClaimBanner show={false} onDismiss={() => {}} />
      </I18nProvider>,
    );
    expect(container.firstChild).toBeNull();
  });
});
