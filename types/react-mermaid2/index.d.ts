import type { FC } from "react";
declare module "react-mermaid2" {
  const Mermaid: FC<{ chart: string }>;
  export default Mermaid;
}
