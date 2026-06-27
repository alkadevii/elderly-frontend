"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Popconfirm,
  message,
  Card,
  Space,
  Typography,
  Segmented,
  Statistic,
  Empty,
  Tag,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  LineChartOutlined,
  TableOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import type { Vital, VitalFormData, VitalTrends, VitalSeriesPoint, VitalType, VitalRangesResponse } from "@/types/Vital";
import type { VitalAssessment } from "@/types/Vital";
import {
  getVitals,
  createVital,
  getVitalTrends,
  deleteVital,
  getVitalRanges,
} from "@/services/vitalService";
import { assessmentColor, assessmentTextColor, getVitalRanges as getLocalRanges } from "@/utils/vitalRanges";


const { Title, Paragraph, Text } = Typography;

const VITAL_TYPES: { value: VitalType; label: string; unit: string }[] = [
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg" },
  { value: "blood_glucose", label: "Blood Glucose", unit: "mg/dL" },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "temperature", label: "Temperature", unit: "°C" },
  { value: "oxygen_saturation", label: "Oxygen Saturation", unit: "%" },
];

const unitFor = (type: VitalType) =>
  VITAL_TYPES.find((t) => t.value === type)?.unit ?? "";

const labelFor = (type: string) =>
  VITAL_TYPES.find((t) => t.value === type)?.label ?? type;

type Props = {
  userId?: string;
};

export default function VitalsSection({ userId }: Props) {
  const [view, setView] = useState<"table" | "trends">("table");
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [trends, setTrends] = useState<VitalTrends>({});
  const [loading, setLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [rangesModalOpen, setRangesModalOpen] = useState(false);
  const [rangesPage, setRangesPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<VitalType>("blood_pressure");
  const [ranges, setRanges] = useState<VitalRangesResponse[]>([]);

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const res = await getVitals({ userId });
      const list = Array.isArray(res) ? res : [];
      setVitals(list);
    } catch {
      message.error("Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    setTrendsLoading(true);
    try {
      const res = await getVitalTrends({ userId });
      setTrends(res || {});
    } catch {
      message.error("Failed to load trends");
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [vitalsRes, rangesRes] = await Promise.all([
          getVitals({ userId }),
          getVitalRanges().catch((err) => {
            console.error("Failed to load vital ranges", err);
            return null;
          }),
        ]);
        if (!cancelled) {
          const list = Array.isArray(vitalsRes) ? vitalsRes : [];
          setVitals(list);
          const rangesData = Array.isArray(rangesRes)
            ? rangesRes
            : (rangesRes?.data || rangesRes?.ranges || []);
          const filtered = (rangesData as VitalRangesResponse[]).filter((r) => r.ranges?.length > 0);
          setRanges(filtered);
        }
      } catch {
        if (!cancelled) message.error("Failed to load vitals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (view !== "trends") return;
    let cancelled = false;
    const load = async () => {
      setTrendsLoading(true);
      try {
        const res = await getVitalTrends({ userId });
        if (!cancelled) setTrends(res || {});
      } catch {
        if (!cancelled) message.error("Failed to load trends");
      } finally {
        if (!cancelled) setTrendsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [view, userId]);

  const openAdd = () => {
    setType("blood_pressure");
    setModalOpen(true);
  };

  const handleTypeChange = (value: VitalType) => {
    setType(value);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const submittedType = values.type as VitalType;
    const payload: VitalFormData = {
      type: submittedType,
      value: Number(values.value),
      secondaryValue:
        submittedType === "blood_pressure" ? Number(values.secondaryValue) : undefined,
      unit: (values.unit as string) || unitFor(submittedType),
      recordedAt: values.recordedAt
        ? dayjs(values.recordedAt as Parameters<typeof dayjs>[0]).toISOString()
        : undefined,
      notes: (values.notes as string) || undefined,
      userId,
    };

    if (payload.type === "blood_pressure" && (payload.value === undefined || payload.secondaryValue === undefined)) {
      message.warning("Both systolic and diastolic values are required for blood pressure");
      return;
    }

    setSubmitting(true);
    try {
      await createVital(payload);
      message.success("Vital recorded");
      setModalOpen(false);
      await fetchVitals();
      if (view === "trends") await fetchTrends();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to record vital");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVital(id);
      message.success("Vital deleted");
      fetchVitals();
      if (view === "trends") fetchTrends();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to delete vital");
    }
  };

  const assessmentColumn = {
    title: "Assessment",
    key: "assessment",
    width: 140,
    render: (_: unknown, record: Vital) => {
      const a: VitalAssessment | undefined = record.assessment;
      if (!a) return <Tag>--</Tag>;
      return (
        <Tag color={assessmentColor(a.status)}>
          {a.label}
        </Tag>
      );
    },
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (t: string) => <Tag color="blue">{labelFor(t)}</Tag>,
    },
    {
      title: "Value",
      key: "value",
      render: (_: unknown, record: Vital) =>
        record.type === "blood_pressure"
          ? `${record.value} / ${record.secondaryValue} ${record.unit}`
          : `${record.value} ${record.unit}`,
    },
    assessmentColumn,
    {
      title: "Recorded At",
      dataIndex: "recordedAt",
      key: "recordedAt",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY h:mm A") : "-"),
    },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true, render: (v: string) => v || "-" },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: unknown, record: Vital) => (
        <Popconfirm title="Delete this vital record?" onConfirm={() => handleDelete(record._id)}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const trendEntries = useMemo(() => Object.entries(trends), [trends]);

  const normalRanges = useMemo(() => getLocalRanges(), []);

  const renderTrends = () => {
    if (trendsLoading) return <Paragraph>Loading trends…</Paragraph>;
    if (trendEntries.length === 0) {
      return <Empty description="No trend data yet" />;
    }
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
        {trendEntries.map(([t, trend]) => {
          const latest = trend.latest;
          const rangeDef = normalRanges.find((r) => r.type === t);

          const refLines: { y: number; label: string; color: string }[] = [];
          if (rangeDef && t !== "weight") {
            const normal = rangeDef.ranges.find((r) => r.status === "normal");
            if (normal?.min !== undefined) {
              refLines.push({ y: normal.min, label: `Normal min: ${normal.min}`, color: "#10b981" });
            }
            if (normal?.max !== undefined) {
              refLines.push({ y: normal.max, label: `Normal max: ${normal.max}`, color: "#10b981" });
            }
          }

          return (
          <Card
            key={t}
            size="small"
            title={<span><Tag color="geekblue">{labelFor(t)}</Tag></span>}
            extra={<Text type="secondary">{trend.count} readings</Text>}
            style={{ borderRadius: 16 }}
          >
            {latest ? (
              <>
              <Space size="large" wrap style={{ marginBottom: 12 }}>
                <Statistic title="Latest" value={latest.value} suffix={trend.unit} />
                {t === "blood_pressure" && latest.secondaryValue !== undefined && (
                  <Statistic title="Latest Diastolic" value={latest.secondaryValue} suffix={trend.unit} />
                )}
                {latest.assessment && (
                  <Tag color={assessmentColor(latest.assessment.status)} style={{ marginTop: 8 }}>
                    {latest.assessment.label}
                  </Tag>
                )}
              </Space>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>
                Last reading: {latest.recordedAt ? dayjs(latest.recordedAt).format("MMM D, YYYY h:mm A") : "-"}
              </Text>
              </>
            ) : (
              <Paragraph style={{ color: "#888" }}>No readings yet</Paragraph>
            )}
            <Space size="large" wrap style={{ marginBottom: 12 }}>
              <Statistic title="Min" value={trend.min} suffix={trend.unit} styles={{ content: { color: "#10b981" } }} />
              <Statistic title="Avg" value={Number(trend.avg).toFixed(1)} suffix={trend.unit} />
              <Statistic title="Max" value={trend.max} suffix={trend.unit} styles={{ content: { color: "#ef4444" } }} />
            </Space>
            {trend.series.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={[...trend.series].sort((a, b) => dayjs(a.recordedAt).valueOf() - dayjs(b.recordedAt).valueOf())}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="recordedAt"
                    tickFormatter={(d: string) => dayjs(d).format("MMM D")}
                    tick={{ fontSize: 11, fill: "#888" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#888" }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip
                    labelFormatter={(d: unknown) => dayjs(d as string).format("MMM D, YYYY h:mm A")}
                    formatter={(value: unknown, name: unknown) => [
                      `${value} ${trend.unit}`,
                      name === "systolic" ? "Systolic" : name === "diastolic" ? "Diastolic" : "Value",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    formatter={(value: unknown) =>
                      value === "systolic" ? "Systolic" : value === "diastolic" ? "Diastolic" : "Value"
                    }
                  />
                  {refLines.map((rl) => (
                    <ReferenceLine key={rl.label} y={rl.y} stroke={rl.color} strokeDasharray="4 4" label={{ value: rl.label, fontSize: 10, fill: rl.color, position: "right" }} />
                  ))}
                  {t === "blood_pressure" ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="systolic"
                        stroke="#4A90E2"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#4A90E2" }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="secondaryValue"
                        name="diastolic"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#10b981" }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="value"
                      stroke="#4A90E2"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#4A90E2" }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            )}
          </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Vitals</Title>
        <Space wrap>
          <Segmented
            value={view}
            onChange={(v) => setView(v as "table" | "trends")}
            options={[
              { label: "Log", value: "table", icon: <TableOutlined /> },
              { label: "Trends", value: "trends", icon: <LineChartOutlined /> },
            ]}
          />
          <Button icon={<InfoCircleOutlined />} onClick={() => setRangesModalOpen(true)}>
            Reference Ranges
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add Vital
          </Button>
        </Space>
      </div>

      {view === "table" ? (
        <Table
          dataSource={vitals}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      ) : (
        renderTrends()
      )}

      <Modal
        title="Record Vital"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: "blood_pressure", recordedAt: dayjs() }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="type" label="Type" rules={[{ required: true, message: "Required" }]}>
            <Select
              options={VITAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={(v) => handleTypeChange(v as VitalType)}
            />
          </Form.Item>

          {type === "blood_pressure" ? (
            <Space.Compact style={{ width: "100%" }}>
              <Form.Item
                name="value"
                label="Systolic"
                rules={[{ required: true, message: "Required" }]}
                style={{ width: "50%", marginRight: 8 }}
              >
                <InputNumber placeholder="120" min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                name="secondaryValue"
                label="Diastolic"
                rules={[{ required: true, message: "Required" }]}
                style={{ width: "50%" }}
              >
                <InputNumber placeholder="80" min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Space.Compact>
          ) : (
            <Form.Item name="value" label="Value" rules={[{ required: true, message: "Required" }]}>
              <InputNumber placeholder="0" style={{ width: "100%" }} />
            </Form.Item>
          )}

          <Form.Item name="unit" label="Unit">
            <Input placeholder={unitFor(type)} />
          </Form.Item>

          <Form.Item name="recordedAt" label="Recorded At">
            <DatePicker showTime style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Vital Reference Ranges"
        open={rangesModalOpen}
        onCancel={() => { setRangesModalOpen(false); setRangesPage(1); }}
        footer={null}
        width={600}
      >
        {ranges.length === 0 ? (
          <Paragraph style={{ color: "#888", textAlign: "center", padding: 24 }}>
            Loading ranges…
          </Paragraph>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(() => {
              const idx = rangesPage - 1;
              const r = ranges[idx];
              if (!r) return null;
              return (
                <Card key={r.type} size="small" title={labelFor(r.type)} style={{ borderRadius: 12 }}>
                  {r.ranges.map((range) => (
                    <div
                      key={range.status}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Space>
                        <Tag color={assessmentColor(range.status)} style={{ minWidth: 60, textAlign: "center" }}>
                          {range.label}
                        </Tag>
                        <span style={{ color: "#555", fontSize: 13, fontWeight: 500 }}>
                          {range.display}
                        </span>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.unit}</Text>
                    </div>
                  ))}
                </Card>
              );
            })()}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
              <Pagination
                current={rangesPage}
                total={ranges.length}
                pageSize={1}
                onChange={(p) => setRangesPage(p)}
                showSizeChanger={false}
                showTotal={(t) => `${labelFor(ranges[rangesPage - 1]?.type || "")}`}
              />
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}