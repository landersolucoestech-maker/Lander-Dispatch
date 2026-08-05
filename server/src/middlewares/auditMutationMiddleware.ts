import type { NextFunction, Request, Response } from "express";
import { recordAudit } from "../lib/audit";

const IGNORED_PREFIXES = [
  "/auth",
  "/health",
  "/healthz",
  "/storage",
  "/audit-logs",
  "/documents",
  "/pdf-import",
];

const ENTITY_NAMES: Record<string, string> = {
  carriers: "carrier",
  brokers: "broker",
  loads: "load",
  invoices: "invoice",
  transactions: "transaction",
  settings: "company_profile",
  crm: "crm_record",
  "crm-drivers": "driver",
};

function shouldAudit(req: Request): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return false;
  return !IGNORED_PREFIXES.some((prefix) => req.path.startsWith(prefix));
}

function resolveEvent(req: Request) {
  const segments = req.path.split("/").filter(Boolean);
  const root = segments[0] ?? "record";
  const entityType = (ENTITY_NAMES[root] ?? root.replace(/s$/, "")) || "record";
  const entityId = segments[1] && segments[1] !== "overview" ? segments[1] : null;
  const isPayment = root === "invoices" && segments[2] === "payments";

  if (isPayment) {
    return {
      action: "invoice.payment.recorded",
      entityType: "invoice",
      entityId,
      summary: `Recorded payment for invoice ${entityId ?? "record"}`,
    };
  }

  const verb =
    req.method === "POST"
      ? "created"
      : req.method === "DELETE"
        ? "deleted"
        : "updated";

  return {
    action: `${entityType}.${verb}`,
    entityType,
    entityId,
    summary: `${verb[0]?.toUpperCase()}${verb.slice(1)} ${entityType.replaceAll("_", " ")}${
      entityId ? ` ${entityId}` : ""
    }`,
  };
}

export function auditMutationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!shouldAudit(req)) {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    const event = resolveEvent(req);
    void recordAudit(req, {
      ...event,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      },
    }).catch((error: unknown) => {
      req.log.error({ err: error }, "Failed to record audit event");
    });
  });

  next();
}
