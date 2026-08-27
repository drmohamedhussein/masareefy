import type { Metadata } from "next";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = {
  title: "تضمين Notion",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  return <ExpensesView compact />;
}
