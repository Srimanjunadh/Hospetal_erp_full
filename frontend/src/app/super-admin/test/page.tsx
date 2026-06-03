"use client";
import DashboardLayout from "@/components/DashboardLayout";

export default function TestPage() {
  return (
    <DashboardLayout role="super_admin" userName="Test Admin">
      <h1>TEST ROUTE SUCCESSFUL</h1>
    </DashboardLayout>
  );
}
