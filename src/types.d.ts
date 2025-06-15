declare module "react-mermaid2" {
  import type { ComponentType } from "react";
  const Mermaid: ComponentType<{
    chart: string;
    config?: Record<string, unknown>;
  }>;
  export default Mermaid;
}
declare module "tippy.js/dist/tippy.css";
declare module "leaflet";
