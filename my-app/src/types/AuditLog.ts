export type AuditLog = {
  _id: string;
  actor: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetModel: string;
  resourceId: string;
  details: Record<string, unknown>;
  ip: string;
  createdAt: string;
};

export type AuditLogQuery = {
  actor?: string;
  action?: string;
  targetModel?: string;
  targetUser?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type AuditLogStats = {
  totalLogs: number;
  byAction: { _id: string; count: number }[];
  byTargetModel: { _id: string; count: number }[];
};
