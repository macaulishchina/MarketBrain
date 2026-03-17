import { auth } from '../../../../lib/auth';

export default async function SettingsProfilePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and preferences.
        </p>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <p className="text-sm">{user.name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm">{user.email}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <p className="text-sm capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
