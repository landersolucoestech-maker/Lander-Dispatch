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
  "crm-drivers": "driver",
};

interface AuditMutationEvent {
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
}

function shouldAudit(req: Request): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return false;
  return !IGNORED_PREFIXES.some((prefix) => req.path.startsWith(prefix));
}

function mutationVerb(method: string): "created" | "updated" | "deleted" {
  if (method === "POST") return "created";
  if (method === "DELETE") return "deleted";
  return "updated";
}

function standardEvent(
  method: string,
  entityType: string,
  entityId: string | null,
): AuditMutationEvent {
  const verb = mutationVerb(method);
  return {
    action: `${entityType}.${verb}`,
    entityType,
    entityId,
    summary: `${verb[0]?.toUpperCase()}${verb.slice(1)} ${entityType.replaceAll("_", " ")}${
      entityId ? ` ${entityId}` : ""
    }`,
  };
}

function resolveEvent(req: Request): AuditMutationEvent {
  const segments = req.path.split("/").filter(Boolean);
  const root = segments[0] ?? "record";

  if (root === "crm") {
    const collection = segments[1];
    const entityType =
      collection === "leads"
        ? "lead"
        : collection === "contacts"
          ? "contact"
          : "crm_record";
    const entityId = segments[2] && segments[2] !== "overview" ? segments[2] : null;

    if (collection === "leads" && segments[3] === "convert") {
      return {
        action: "lead.converted",
        entityType: "lead",
        entityId,
        summary: `Converted lead${entityId ? ` ${entityId}` : ""} into an operational record`,
      };
    }

    return standardEvent(req.method, entityType, entityId);
  }

  const entityType = (ENTITY_NAMES[root] ?? root.replace(/s$/, "")) || "record";
  const entityId = segments[1] && segments[1] !== "overview" ? segments[1] : null;

  if (root === "invoices" && segments[2] === "payments") {
    return {
      action: "invoice.payment.recorded",
      entityType: "invoice",
      entityId,
      summary: `Recorded payment for invoice ${entityId ?? "record"}`,
    };
  }

  return standardEvent(req.method, entityType, entityId);
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
