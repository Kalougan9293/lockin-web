import { DesktopOnlyScreen } from "@/components/layout/DesktopOnlyScreen";

type ResponsiveDesktopGateProps = {
  children: React.ReactNode;
  copyUrl?: string;
};

/**
 * Affiche les enfants à partir de md (768px). Sur mobile : écran « ordinateur requis ».
 * CSS pur (hidden/md:contents) — pas de flash d'hydratation.
 */
export function ResponsiveDesktopGate({
  children,
  copyUrl,
}: ResponsiveDesktopGateProps) {
  return (
    <>
      <div className="hidden md:contents">{children}</div>
      <div className="md:hidden">
        <DesktopOnlyScreen copyUrl={copyUrl} />
      </div>
    </>
  );
}
