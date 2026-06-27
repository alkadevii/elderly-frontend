"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Descriptions,
  Modal,
} from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  ApiOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { AuditLog, AuditLogStats } from "@/types/AuditLog";
import { getAuditLogs, getAuditLogStats } from "@/services/auditLogService";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const targetModelColors: Record<string, string> = {
  User: "green",
  Appointment: "geekblue",
  Vital: "cyan",
  Medication: "purple",
  MedicationLog: "blue",
};

export default function AuditLogSection() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [targetModelFilter, setTargetModelFilter] = useState<string | undefined>(undefined);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, unknown> = { page, limit: 50 };
      if (targetModelFilter) query.targetModel = targetModelFilter;
      if (dateRange?.[0]) query.from = dateRange[0].format("YYYY-MM-DD");
      if (dateRange?.[1]) query.to = dateRange[1].format("YYYY-MM-DD");
      const res = await getAuditLogs(query);
      setLogs(Array.isArray(res.logs) ? res.logs : []);
      setTotal(res.pagination?.total || 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, targetModelFilter, dateRange]);

  const defaultsSet = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getAuditLogStats();
      const data: AuditLogStats = res.data || res;
      setStats(data);
      if (!defaultsSet.current) {
        defaultsSet.current = true;
        if ((data.byTargetModel || []).length > 0) setTargetModelFilter(data.byTargetModel[0]._id);
      }
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const columns = [
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (d: string) => (
        <Text style={{ fontSize: 13 }}>{dayjs(d).format("MMM D, YYYY h:mm A")}</Text>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 180,
      render: (_: unknown, record: AuditLog) => (
        <Space>
          <UserOutlined />
            <Text>{record.actor?.name || record.actor?.email || "-"}</Text>
        </Space>
      ),
    },
    {
      title: "Target",
      dataIndex: "targetModel",
      key: "targetModel",
      width: 140,
      render: (m: string) => (
        <Tag color={targetModelColors[m] || "default"}>{m}</Tag>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_: unknown, record: AuditLog) => (
        <Space>
          {record.details && Object.keys(record.details).length > 0 ? (
            <Text
              ellipsis
              style={{ maxWidth: 300, cursor: "pointer", color: "#1677ff" }}
              onClick={() => setSelectedLog(record)}
            >
              <EyeOutlined style={{ marginRight: 4 }} />
              View Details
            </Text>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {stats && (
        <Row gutter={20} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card style={{ borderRadius: 16, textAlign: "center" }}>
              <Statistic
                title="Total Entries"
                value={stats.totalLogs}
                prefix={<FileTextOutlined />}
                styles={{ content: { color: "#1677ff" } }}
              />
            </Card>
          </Col>
          {(stats.byTargetModel || []).slice(0, 3).map((m) => (
            <Col span={6} key={m._id}>
              <Card style={{ borderRadius: 16, textAlign: "center" }}>
                <Statistic
                  title={m._id}
                  value={m.count}
                  prefix={<ApiOutlined />}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <Space wrap>
            {stats && (
              <Select
                value={targetModelFilter}
                onChange={(v) => { setTargetModelFilter(v || undefined); setPage(1); }}
                style={{ width: 160 }}
                placeholder="All Targets"
                allowClear
              >
                {(stats.byTargetModel || []).map((m) => (
                  <Select.Option key={m._id} value={m._id}>{m._id}</Select.Option>
                ))}
              </Select>
            )}
            <RangePicker
              value={dateRange as [dayjs.Dayjs | null, dayjs.Dayjs | null] | undefined}
              onChange={(dates) => { setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null); setPage(1); }}
              allowClear
            />
          </Space>
        </div>

        <Table
          dataSource={logs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (t) => `${t} entries`,
          }}
        />
      </Card>

      <Modal
        title="Audit Log Details"
        open={!!selectedLog}
        onCancel={() => setSelectedLog(null)}
        footer={null}
        width={640}
      >
        {selectedLog && (
          <Descriptions column={1} bordered size="small" style={{ marginTop: 16 }}>
            <Descriptions.Item label="ID">{selectedLog._id}</Descriptions.Item>
            <Descriptions.Item label="User">
              {selectedLog.actor?.name} ({selectedLog.actor?.email})
            </Descriptions.Item>
            <Descriptions.Item label="Action">{selectedLog.action}</Descriptions.Item>
            <Descriptions.Item label="Target Model">{selectedLog.targetModel}</Descriptions.Item>
            <Descriptions.Item label="Resource ID">{selectedLog.resourceId}</Descriptions.Item>
            <Descriptions.Item label="IP Address">{selectedLog.ip}</Descriptions.Item>
            <Descriptions.Item label="Timestamp">
              {dayjs(selectedLog.createdAt).format("MMM D, YYYY h:mm:ss A")}
            </Descriptions.Item>
            <Descriptions.Item label="Details">
              <pre style={{ fontSize: 12, maxHeight: 300, overflow: "auto", background: "#f5f5f5", padding: 12, borderRadius: 8, margin: 0 }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
