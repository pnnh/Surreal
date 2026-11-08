import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/settings/ProfileForm";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader page="settings" />
      <ProfileForm />
    </div>
  );
}
