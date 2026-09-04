import type { Metadata } from "next";
import { AccessControlPage } from "@/components/access-control/access-control-page";

export const metadata: Metadata = { title: "Access control" };

export default function AccessControlRoute() {
  return <AccessControlPage />;
}
