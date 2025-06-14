import "@testing-library/jest-dom";
import type { ImgHTMLAttributes } from "react";
import { createElement } from "react";
import { afterAll, beforeAll, vi } from "vitest";

let getUserMediaSpy: ReturnType<typeof vi.fn> | undefined;

beforeAll(() => {
  if (!navigator.mediaDevices) {
    // @ts-ignore - jsdom may not implement mediaDevices
    navigator.mediaDevices = {} as MediaDevices;
  }
  if (!navigator.mediaDevices.getUserMedia) {
    // @ts-ignore - jsdom may not implement getUserMedia
    navigator.mediaDevices.getUserMedia = async () => undefined;
  }
  getUserMediaSpy = vi
    .spyOn(navigator.mediaDevices, "getUserMedia")
    .mockResolvedValue(undefined);

  vi.mock("next/image", () => ({
    __esModule: true,
    default: (props: ImgHTMLAttributes<HTMLImageElement>) =>
      createElement("img", props),
  }));
});

afterAll(() => {
  getUserMediaSpy?.mockRestore();
  vi.unmock("next/image");
});
