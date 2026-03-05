import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createTicketDraft,
  getTicketDraft,
  getTicketRecommendations,
  searchTickets,
} from "../../api/ticketApi";
import "./index.css";

const { Title, Text } = Typography;

const sortOptions = [
  { label: "最早出发", value: "earliest_departure" },
  { label: "最短耗时", value: "shortest_duration" },
  { label: "最低价格", value: "lowest_price" },
];

function TicketsPage({ embedded = false, openRequest = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("direct");
  const [mobileSuggestOpen, setMobileSuggestOpen] = useState(false);
  const [metaNotice, setMetaNotice] = useState("");
  const [draft, setDraft] = useState(null);
  const [activeDraftId, setActiveDraftId] = useState(embedded ? "" : (searchParams.get("draftId") || ""));
  const [sortBy, setSortBy] = useState("earliest_departure");
  const [result, setResult] = useState({ directOptions: [], transferOptions: [] });
  const [recommendations, setRecommendations] = useState({});
  const autoLoadingDraftRef = useRef(new Set());
  const searchInFlightRef = useRef(new Set());
  const recommendInFlightRef = useRef(new Set());
  const preloadedDraftIdRef = useRef("");

  useEffect(() => {
    if (embedded) return;
    const draftIdFromQuery = searchParams.get("draftId") || "";
    if (draftIdFromQuery && draftIdFromQuery !== activeDraftId) {
      setActiveDraftId(draftIdFromQuery);
    }
  }, [searchParams, activeDraftId, embedded]);

  useEffect(() => {
    if (embedded) return;
    if (searchParams.get("refine") === "1") {
      setMetaNotice("可继续细化偏好后重新查询，例如选择车次类型、日期与排序。");
    }
  }, [searchParams, embedded]);

  useEffect(() => {
    if (!embedded || !openRequest?.requestId) return;
    if (openRequest.draftId) {
      setActiveDraftId(openRequest.draftId);
    }
    if (openRequest.preloaded) {
      const preloaded = openRequest.preloaded;
      if (preloaded.draft) {
        setDraft(preloaded.draft);
        form.setFieldsValue({
          fromCity: preloaded.draft.route?.fromCity,
          toCity: preloaded.draft.route?.toCity,
          date: preloaded.draft.date ? dayjs(preloaded.draft.date) : null,
          trainTypes: preloaded.draft.preferences?.trainTypes || [],
        });
      }
      if (preloaded.result) {
        setResult({
          directOptions: preloaded.result.directOptions || [],
          transferOptions: preloaded.result.transferOptions || [],
        });
      }
      setRecommendations(preloaded.recommendations || {});
      setMetaNotice(preloaded.metaNotice || "");
      preloadedDraftIdRef.current = openRequest.draftId || "";
    }
    if (openRequest.refine) {
      setMetaNotice("可继续细化偏好后重新查询，例如选择车次类型、日期与排序。");
    }
  }, [openRequest, embedded, form]);

  const columns = useMemo(
    () => [
      { title: "车次", dataIndex: "trainNo", key: "trainNo", width: 120 },
      {
        title: `出发${draft?.route?.fromCity ? `(${draft.route.fromCity})` : "(出发地)"}`,
        dataIndex: "departAt",
        key: "departAt",
        width: 180,
      },
      {
        title: `到达${draft?.route?.toCity ? `(${draft.route.toCity})` : "(到达地)"}`,
        dataIndex: "arriveAt",
        key: "arriveAt",
        width: 180,
      },
      {
        title: "耗时(分钟)",
        dataIndex: "durationMinutes",
        key: "durationMinutes",
        width: 120,
      },
      {
        title: "最低票价",
        dataIndex: "priceMin",
        key: "priceMin",
        render: (price) => `${price || "--"} 元`,
        width: 120,
      },
      {
        title: "余票",
        dataIndex: "seatAvailability",
        key: "seatAvailability",
        render: (seatAvailability) =>
          Object.entries(seatAvailability || {}).map(([seat, status]) => (
            <Tag key={seat}>{seat}:{status}</Tag>
          )),
      },
    ],
    [draft?.route?.fromCity, draft?.route?.toCity]
  );

  const loadDraft = async (targetDraftId) => {
    if (!targetDraftId) return;
    const data = await getTicketDraft(targetDraftId);
    setDraft(data);
    form.setFieldsValue({
      fromCity: data.route?.fromCity,
      toCity: data.route?.toCity,
      date: data.date ? dayjs(data.date) : null,
      trainTypes: data.preferences?.trainTypes || [],
    });
  };

  const normalizeTrainTypes = (trainTypes) => {
    const merged = (trainTypes || []).flatMap((item) =>
      String(item || "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
    );
    return Array.from(new Set(merged));
  };

  const buildPayloadByForm = (values) => ({
    route: {
      fromCity: values.fromCity,
      toCity: values.toCity,
    },
    date: dayjs(values.date).format("YYYY-MM-DD"),
    preferences: {
      trainTypes: normalizeTrainTypes(values.trainTypes),
      seatTypes: [],
      departureTimeRange: "",
      strategy: "fastest",
    },
  });

  const isSameArray = (a = [], b = []) => {
    if (a.length !== b.length) return false;
    return [...a].sort().every((item, idx) => item === [...b].sort()[idx]);
  };

  const ensureDraftIdByForm = async () => {
    const values = form.getFieldsValue();
    if (!values.fromCity || !values.toCity || !values.date) {
      setMetaNotice("请先填写出发地、到达地和日期");
      return "";
    }
    const nextPayload = buildPayloadByForm(values);
    const currentTrainTypes = normalizeTrainTypes(draft?.preferences?.trainTypes || []);
    const nextTrainTypes = normalizeTrainTypes(nextPayload.preferences.trainTypes || []);
    const isDraftUnchanged = Boolean(
      activeDraftId
      && draft
      && draft.route?.fromCity === nextPayload.route.fromCity
      && draft.route?.toCity === nextPayload.route.toCity
      && String(draft.date || "") === nextPayload.date
      && isSameArray(currentTrainTypes, nextTrainTypes)
    );

    if (isDraftUnchanged) return activeDraftId;

    const draftMeta = await createTicketDraft(nextPayload);
    setActiveDraftId(draftMeta.draftId);
    if (!embedded) {
      setSearchParams({ draftId: draftMeta.draftId });
    }
    await loadDraft(draftMeta.draftId);
    return draftMeta.draftId;
  };

  const executeSearch = async (filtersOverride) => {
    const draftIdToUse = await ensureDraftIdByForm();
    if (!draftIdToUse) return;
    const filters = filtersOverride || {};
    const requestKey = JSON.stringify({
      draftId: draftIdToUse,
      sortBy,
      filters,
    });
    if (searchInFlightRef.current.has(requestKey)) {
      return;
    }
    searchInFlightRef.current.add(requestKey);
    setLoading(true);
    try {
      const data = await searchTickets({
        draftId: draftIdToUse,
        sortBy,
        filters,
      });
      setResult({
        directOptions: data.directOptions || [],
        transferOptions: data.transferOptions || [],
      });
      setMetaNotice(data.meta?.notice || "");
      await loadRecommendations(draftIdToUse);
    } catch (error) {
      setMetaNotice(error?.response?.data?.message || "暂时无法加载票务结果，请稍后重试");
      setResult({ directOptions: [], transferOptions: [] });
    } finally {
      searchInFlightRef.current.delete(requestKey);
      setLoading(false);
    }
  };

  const loadRecommendations = async (draftIdParam) => {
    const draftIdToUse = draftIdParam || activeDraftId;
    if (!draftIdToUse) return;
    if (recommendInFlightRef.current.has(draftIdToUse)) {
      return;
    }
    recommendInFlightRef.current.add(draftIdToUse);
    setRecommendLoading(true);
    try {
      const data = await getTicketRecommendations({ draftId: draftIdToUse });
      setRecommendations(data || {});
    } catch (_) {
      setRecommendations({});
    } finally {
      recommendInFlightRef.current.delete(draftIdToUse);
      setRecommendLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!activeDraftId) return;
      if (autoLoadingDraftRef.current.has(activeDraftId)) {
        return;
      }
      if (preloadedDraftIdRef.current === activeDraftId) {
        preloadedDraftIdRef.current = "";
        return;
      }
      autoLoadingDraftRef.current.add(activeDraftId);
      try {
        await loadDraft(activeDraftId);
        await executeSearch();
      } finally {
        autoLoadingDraftRef.current.delete(activeDraftId);
      }
    })();
  }, [activeDraftId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dataSource = activeTab === "direct" ? result.directOptions : result.transferOptions;

  const applyRecommendation = (recommendItem) => {
    if (!recommendItem) return;
    if (recommendItem.tripType === "transfer") {
      setActiveTab("transfer");
    } else {
      setActiveTab("direct");
    }
    executeSearch({
      preferredOptionId: recommendItem.optionId,
      onlySecondClassAvailable: false,
    });
    setMetaNotice("已应用推荐，已将推荐车次置顶展示。");
  };

  const SuggestPanel = (
    <div className="ticket-suggest-panel">
      <div className="tickets-page__suggest-header">
        <h3>AI 决策助手</h3>
        <p>根据当前结果自动生成最快 / 最省钱 / 最稳妥方案</p>
      </div>
      {recommendLoading ? (
        <Spin />
      ) : (
        <div className="recommend-grid">
          {[
            ["最快方案", recommendations.fastest, "time"],
            ["最便宜方案", recommendations.cheapest, "price"],
            ["最舒适方案", recommendations.comfortable, "safe"],
          ].map(([label, item, mode]) => (
            <Card key={label} size="small" className={`recommend-card mode-${mode}`}>
              <div className="recommend-card__title">
                <span>{label}</span>
                {item && <span style={{ color: "#f59e0b", fontSize: "14px" }}>{item.price}</span>}
              </div>
              {item ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {(item.reasons || []).map((reason) => (
                    <Text key={reason} type="secondary" style={{ fontSize: 12, display: 'block', lineHeight: 1.4 }}>
                      • {reason}
                    </Text>
                  ))}
                  <Button size="small" type="primary" onClick={() => applyRecommendation(item)} block style={{ background: "#eab308", borderColor: "#eab308", marginTop: 8 }}>
                    应用推荐
                  </Button>
                </Space>
              ) : (
                <div className="recommend-card__empty">
                  <span>暂无当前策略推荐</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`tickets-page ${embedded ? "tickets-page--embedded" : ""}`}>
      <div className="tickets-page__layout">
        <div className="tickets-page__main">
          <div className="tickets-page__header">
            <div>
              <Title level={3} style={{ marginBottom: 4 }}>票务工作台</Title>
              <Text type="secondary">智能查询 + AI 决策推荐，减少无效对比</Text>
            </div>
            {draft && <Tag color="gold">来自 AI 助手 · {draft.draftId}</Tag>}
          </div>

          <Card className="ticket-search-card" bodyStyle={{ padding: "16px 20px 16px 20px" }}>
        {draft ? (
          <div className="route-hero">
            <div className="route-hero__title">
              {draft.route?.fromCity} -> {draft.route?.toCity}
            </div>
            <Space wrap>
              <Tag>{draft.date}</Tag>
              {(draft.preferences?.trainTypes || []).map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
              <Tag color="blue">任务接力中</Tag>
            </Space>
          </div>
        ) : null}
        <Form
          form={form}
          layout="vertical"
          onFinish={() => executeSearch()}
        >
          <Row gutter={16}>
            <Col xs={24} md={5}>
              <Form.Item label="出发地" name="fromCity" rules={[{ required: true, message: "请输入" }]} style={{ marginBottom: 0 }}>
                <Input placeholder="例如：上海" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item label="到达地" name="toCity" rules={[{ required: true, message: "请输入" }]} style={{ marginBottom: 0 }}>
                <Input placeholder="例如：北京" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item label="日期" name="date" rules={[{ required: true, message: "请选择" }]} style={{ marginBottom: 0 }}>
                <DatePicker 
                  placeholder="选择日期" 
                  style={{ width: "100%", borderRadius: 8 }}
                  disabledDate={(current) => {
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={5}>
              <Form.Item label="车次类型" name="trainTypes" style={{ marginBottom: 0 }}>
                <Select 
                  mode="multiple" 
                  placeholder="如高铁"
                  options={[
                    { label: "高铁", value: "G" },
                    { label: "动车", value: "D" },
                    { label: "城际", value: "C" },
                    { label: "直达", value: "Z" },
                    { label: "特快", value: "T" },
                    { label: "快速", value: "K" }
                  ]} 
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%', borderRadius: 8, height: 32, background: "#1c1917" }}>
                查询
              </Button>
            </Col>
          </Row>
          <Space style={{ marginTop: 16 }}>
            <Select
              value={sortBy}
              options={sortOptions}
              onChange={(value) => setSortBy(value)}
              style={{ width: 140, borderRadius: 8 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => executeSearch()} style={{ borderRadius: 8 }}>
              重置参数
            </Button>
            <Button className="mobile-only" onClick={() => setMobileSuggestOpen(true)} style={{ borderRadius: 8 }}>
              查看 AI 建议
            </Button>
          </Space>
        </Form>
      </Card>

      {metaNotice ? (
        <Alert type="warning" showIcon message={metaNotice} style={{ marginBottom: 12 }} />
      ) : null}

      <div className="tickets-page__list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: "direct", label: "直达车次" },
              { key: "transfer", label: "中转优选" },
            ]}
            style={{ marginBottom: 0 }}
          />
        </div>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin /></div>
        ) : dataSource.length ? (
          <Table
            rowKey="optionId"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            scroll={{ x: 860, y: 420 }}
          />
        ) : (
          <div style={{ 
            flex: 1,
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center"
          }}>
            <Empty 
              description={<span style={{ color: '#a8a29e' }}>暂无符合条件结果</span>} 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
    <div className="tickets-page__suggest">
      <div className="tickets-page__suggest-content">
        {SuggestPanel}
      </div>
    </div>
  </div>

      <Drawer
        title="AI 推荐方案"
        open={mobileSuggestOpen}
        onClose={() => setMobileSuggestOpen(false)}
      >
        {SuggestPanel}
      </Drawer>
    </div>
  );
}

export default TicketsPage;
