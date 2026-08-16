export const roles = [
  "SUPER_ADMIN",
  "ORGANIZATION_ADMIN",
  "DOMAIN_MANAGER",
  "VIEWER",
] as const;

export type Role = (typeof roles)[number];

export interface HealthResponse {
  status: "ok";
  service: "api" | "worker";
  timestamp: string;
}
