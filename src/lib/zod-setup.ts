import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

let extended = false;

export function setupZodOpenApi(): void {
  if (!extended) {
    extendZodWithOpenApi(z);
    extended = true;
  }
}
