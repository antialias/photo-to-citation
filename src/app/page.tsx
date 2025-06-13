export { dynamic } from "./cases/page";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/cases");
}
