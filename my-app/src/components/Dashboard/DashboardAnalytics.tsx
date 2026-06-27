"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Spin,
  Empty,
  Progress,
  DatePicker,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import type {
  AppointmentAdherence,
  VitalAnomalies,
  VitalTypeAnomaly,
  MedicationCompliance,
  PerMedicationCompliance,
} from "@/types/Dashboard";
import {
  getAppointmentAdherence,
  getVitalAnomalies,
  getMedicationCompliance,
} from "@/services/dashboardService";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PIE_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

function AppointmentAdherenceCard({ from, to }: { from?: string; to?: string }) {
  const [data, setData] = useState<AppointmentAdherence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAppointmentAdherence({ from, to });
        if (!cancelled) setData(res.data || res);
      } catch {
        if (!cancelled) console.error("Failed to load appointment adherence");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [from, to]);

  if (loading) return <Card style={{ borderRadius: 16 }}><Spin /></Card>;
  if (!data) return null;

  const rate = data.adherenceRate;
  const color = rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";

  const pieData = [
    { name: "Completed", value: data.completed },
    { name: "Cancelled", value: data.cancelled },
    { name: "Rejected", value: data.rejected },
    { name: "Scheduled", value: data.scheduled },
  ].filter((d) => d.value > 0);

  return (
    <Card
      title={<span><CalendarOutlined style={{ marginRight: 8 }} />Appointment Adherence</span>}
      style={{ borderRadius: 16, height: "100%" }}
    >
      <Statistic
        title={`Adherence (completed / non-cancelled)`}
        value={rate}
        suffix="%"
        styles={{ content: { color } }}
      />
      <div style={{ marginTop: 8 }}>
        <Text type="secondary">{data.completed} / {data.nonCancelled || data.total} completed</Text>
      </div>
      {pieData.length > 0 && (
        <div style={{ marginTop: 12, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function VitalAnomaliesCard({ from, to }: { from?: string; to?: string }) {
  const [data, setData] = useState<VitalAnomalies | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getVitalAnomalies({ from, to });
        if (!cancelled) setData(res.data || res);
      } catch {
        if (!cancelled) console.error("Failed to load vital anomalies");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [from, to]);

  if (loading) return <Card style={{ borderRadius: 16 }}><Spin /></Card>;
  if (!data) return null;

  const summary = data.summary;
  const normalRate = summary ? 100 - summary.overallAnomalyRate : 100;
  const color = normalRate >= 80 ? "#10b981" : normalRate >= 50 ? "#f59e0b" : "#ef4444";

  const entries: [string, VitalTypeAnomaly][] = data.anomalies
    ? Object.entries(data.anomalies)
    : [];

  const barData = entries.map(([type, a]) => ({
    name: type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    abnormal: a.abnormal,
    normal: a.normal,
    rate: a.anomalyRate,
  }));

  return (
    <Card
      title={<span><HeartOutlined style={{ marginRight: 8 }} />Vitals</span>}
      style={{ borderRadius: 16, height: "100%" }}
    >
      <Statistic
        title="Normal readings"
        value={normalRate}
        suffix="%"
        styles={{ content: { color } }}
      />
      {summary && (
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
          {summary.totalReadings - summary.totalAnomalies} / {summary.totalReadings} normal
        </Text>
      )}
      {barData.length > 0 && (
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="normal" stackId="a" fill="#10b981" name="Normal" />
              <Bar dataKey="abnormal" stackId="a" fill="#ef4444" name="Abnormal" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {entries.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {entries.map(([type, a]) => (
            <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0" }}>
              <Tag color={a.anomalyRate > 30 ? "red" : a.anomalyRate > 10 ? "orange" : "green"}>
                {type.replace(/_/g, " ")}
              </Tag>
              <Text type="secondary">{a.anomalyRate}% abnormal</Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function MedicationComplianceCard({ from, to }: { from?: string; to?: string }) {
  const [data, setData] = useState<MedicationCompliance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMedicationCompliance({ from, to });
        if (!cancelled) setData(res.data || res);
      } catch {
        if (!cancelled) console.error("Failed to load medication compliance");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [from, to]);

  if (loading) return <Card style={{ borderRadius: 16 }}><Spin /></Card>;
  if (!data) return null;

  const rate = data.overallCompliance;
  const color = rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";
  const meds: PerMedicationCompliance[] = Array.isArray(data.perMedication) ? data.perMedication : [];

  const columns = [
    {
      title: "Medication",
      key: "medication",
      render: (_: unknown, record: PerMedicationCompliance) => (
        <Text strong>{record.medicineName}</Text>
      ),
    },
    { title: "Scheduled", dataIndex: "scheduledDoses", key: "scheduledDoses", width: 80 },
    { title: "Taken", dataIndex: "taken", key: "taken", width: 60 },
    { title: "Missed", dataIndex: "missed", key: "missed", width: 60 },
    {
      title: "Compliance",
      key: "compliance",
      width: 140,
      render: (_: unknown, record: PerMedicationCompliance) => (
        <Progress
          percent={record.compliance}
          size="small"
          strokeColor={record.compliance >= 80 ? "#10b981" : record.compliance >= 50 ? "#f59e0b" : "#ef4444"}
        />
      ),
    },
  ];

  return (
    <Card
      title={<span><MedicineBoxOutlined style={{ marginRight: 8 }} />Medication Compliance</span>}
      style={{ borderRadius: 16, height: "100%" }}
    >
      <Statistic
        title="Compliance (taken / scheduled)"
        value={rate}
        suffix="%"
        prefix={<CheckCircleOutlined />}
        styles={{ content: { color } }}
      />
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
        {data.totalTaken} of {data.totalScheduled} doses taken
      </Text>

      {meds.length > 0 ? (
        <Table
          dataSource={meds}
          columns={columns}
          rowKey="medicineName"
          pagination={false}
          size="small"
          showHeader={false}
        />
      ) : (
        <Empty description="No medication data" />
      )}
    </Card>
  );
}

export default function DashboardAnalytics() {
  const now = dayjs();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    now.subtract(30, "day"),
    now,
  ]);

  const from = useMemo(
    () => (dateRange[0] ? dateRange[0].format("YYYY-MM-DD") : undefined),
    [dateRange[0]]
  );
  const to = useMemo(
    () => (dateRange[1] ? dateRange[1].format("YYYY-MM-DD") : undefined),
    [dateRange[1]]
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Title level={5} style={{ margin: 0 }}>Analytics Overview</Title>
        <RangePicker
          value={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] || [null, null])}
          allowClear={false}
        />
      </div>
      <Row gutter={[20, 20]}>
        <Col xs={24} md={8}>
          <AppointmentAdherenceCard from={from} to={to} />
        </Col>
        <Col xs={24} md={8}>
          <VitalAnomaliesCard from={from} to={to} />
        </Col>
        <Col xs={24} md={8}>
          <MedicationComplianceCard from={from} to={to} />
        </Col>
      </Row>
    </div>
  );
}
