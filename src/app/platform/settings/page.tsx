export default function PlatformSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Platform settings</h1>
      <p className="text-sm text-gray-600">Global settings are configured through environment variables. See <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">.env.example</code> for available options.</p>
    </div>
  );
}
