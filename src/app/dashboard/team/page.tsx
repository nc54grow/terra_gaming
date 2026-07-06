import { UserPlus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";

export default function TeamPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Squad"
        title="Your Team"
        blurb="Manage your roster, roles, and recruit new operators for the drop zone."
      />

      <div className="px-8 py-8 md:px-12">
        <div className="grid gap-4 sm:grid-cols-2"></div>
      </div>
    </div>
  );
}
