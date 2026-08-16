import { GlobeIcon } from "./icons";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "brand brand-compact" : "brand"}>
      <span className="brand-logo" aria-hidden="true">
        <GlobeIcon size={compact ? 26 : 50} />
      </span>
      <span className="brand-name">Domain Manager</span>
    </div>
  );
}
