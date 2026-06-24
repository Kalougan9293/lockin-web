import { LockInLogo } from "@/components/brand/LockInLogo";
import { ProfileMenu } from "@/components/auth/ProfileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <LockInLogo />
        <ProfileMenu />
      </div>
    </header>
  );
}
