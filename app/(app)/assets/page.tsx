import { AssetLibrary } from "@/components/assets/AssetLibrary";
import { PageHeader } from "@/components/PageHeader";

export default function AssetsPage() {
  return (
    <div className="space-y-4">
      <PageHeader page="assets" />
      <AssetLibrary />
    </div>
  );
}
