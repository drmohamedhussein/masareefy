import type { Metadata } from "next";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const metadata: Metadata = {
  title: "المصروفات",
};

export default function ExpensesPage() {
  return <ExpensesView />;
}
