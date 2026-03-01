import React, { useState, useEffect, useCallback } from "react";
import { Calendar, List, Card, Badge, Button, Modal, Form, Input, DatePicker, message, Select, Row, Col, Space, Segmented, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { getSchedules, createSchedule, deleteSchedule } from "../../api/scheduleApi";
import LoadingState from "../Common/LoadingState";
import EmptyState from "../Common/EmptyState";
import dayjs from "dayjs";

const { Text } = Typography;

const ScheduleList = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState("day"); // 'day', 'week', 'month'
  const [schedules, setSchedules] = useState([]);
  const [monthSchedules, setMonthSchedules] = useState([]); // 用于日历打点标记
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 获取日程列表（根据 viewMode）
  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      let start, end;
      if (viewMode === "day") {
        start = selectedDate.startOf("day");
        end = selectedDate.endOf("day");
      } else if (viewMode === "week") {
        start = selectedDate.startOf("week");
        end = selectedDate.endOf("week");
      } else {
        start = selectedDate.startOf("month");
        end = selectedDate.endOf("month");
      }

      const data = await getSchedules({
        startTime: start.format("YYYY-MM-DD HH:mm:ss"),
        endTime: end.format("YYYY-MM-DD HH:mm:ss"),
      });
      setSchedules(data);
    } catch (error) {
      message.error("加载日程失败");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  // 获取当月所有日程用于日历打点
  const fetchMonthSchedules = useCallback(async (date) => {
    try {
      const start = date.startOf("month").subtract(7, 'day');
      const end = date.endOf("month").add(7, 'day');
      const data = await getSchedules({
        startTime: start.format("YYYY-MM-DD HH:mm:ss"),
        endTime: end.format("YYYY-MM-DD HH:mm:ss"),
      });
      setMonthSchedules(data);
    } catch (error) {
      console.error("Failed to fetch month schedules", error);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const monthYear = selectedDate.format("YYYY-MM");

  useEffect(() => {
    const date = dayjs(monthYear);
    fetchMonthSchedules(date);
  }, [monthYear, fetchMonthSchedules]);

  const handleCreate = async (values) => {
    try {
      const data = {
        title: values.title,
        description: values.description,
        startTime: values.time[0].format("YYYY-MM-DD HH:mm:ss"),
        endTime: values.time[1]?.format("YYYY-MM-DD HH:mm:ss"),
      };
      await createSchedule(data);
      message.success("创建成功");
      setIsModalVisible(false);
      form.resetFields();
      fetchSchedules();
      fetchMonthSchedules(selectedDate);
    } catch (error) {
      message.error("创建失败");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      message.success("已删除");
      fetchSchedules();
      fetchMonthSchedules(selectedDate);
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 自定义日历头部
  const headerRender = ({ value, onChange }) => {
    const monthOptions = [];
    const months = [
      "1月", "2月", "3月", "4月", "5月", "6月", 
      "7月", "8月", "9月", "10月", "11月", "12月"
    ];

    for (let i = 0; i < 12; i++) {
      monthOptions.push(
        <Select.Option key={i} value={i}>
          {months[i]}
        </Select.Option>
      );
    }

    const year = value.year();
    const month = value.month();
    const options = [];
    for (let i = year - 10; i < year + 10; i += 1) {
      options.push(
        <Select.Option key={i} value={i}>
          {i}年
        </Select.Option>
      );
    }

    return (
      <div style={{ padding: '8px 12px' }}>
        <Row gutter={8} justify="space-between" align="middle">
          <Col flex="auto">
            <Space size={4}>
              <Button 
                size="small" 
                type="text"
                icon={<LeftOutlined style={{ fontSize: 12 }} />} 
                onClick={() => onChange(value.clone().subtract(1, 'month'))} 
              />
              <Select
                size="small"
                dropdownMatchSelectWidth={false}
                value={year}
                onChange={(newYear) => onChange(value.clone().year(newYear))}
                variant="borderless"
                style={{ fontWeight: 600, width: 75 }}
              >
                {options}
              </Select>
              <Select
                size="small"
                dropdownMatchSelectWidth={false}
                value={month}
                onChange={(newMonth) => onChange(value.clone().month(newMonth))}
                variant="borderless"
                style={{ fontWeight: 600, width: 65 }}
              >
                {monthOptions}
              </Select>
              <Button 
                size="small" 
                type="text"
                icon={<RightOutlined style={{ fontSize: 12 }} />} 
                onClick={() => onChange(value.clone().add(1, 'month'))} 
              />
            </Space>
          </Col>
          <Col>
            <Button size="small" type="link" onClick={() => onChange(dayjs())} style={{ padding: 0 }}>
              今天
            </Button>
          </Col>
        </Row>
      </div>
    );
  };

  const cellRender = (current) => {
    const dateStr = current.format("YYYY-MM-DD");
    const hasSchedule = monthSchedules.some(s => dayjs(s.start_time).format("YYYY-MM-DD") === dateStr);
    
    if (hasSchedule) {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#1677ff', margin: '0 auto', marginTop: -2 }} />
        </div>
      );
    }
    return null;
  };

  const getViewTitle = () => {
    if (viewMode === "day") return `${selectedDate.format("MM月DD日")} 日程概览`;
    if (viewMode === "week") {
      const start = selectedDate.startOf("week").format("MM月DD日");
      const end = selectedDate.endOf("week").format("MM月DD日");
      return `本周日程 (${start} - ${end})`;
    }
    return `${selectedDate.format("YYYY年MM月")} 日程概览`;
  };

  return (
    <div style={{ display: "flex", gap: 24, height: "100%", padding: "0 8px" }}>
      {/* 左侧：日历 */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <Card size="small" title="迷你日历" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Calendar 
            fullscreen={false} 
            value={selectedDate} 
            onChange={setSelectedDate} 
            headerRender={headerRender}
            fullCellRender={(date) => {
              const isSelected = date.isSame(selectedDate, 'day');
              const isToday = date.isSame(dayjs(), 'day');
              const isCurrentMonth = date.isSame(selectedDate, 'month');
              
              return (
                <div 
                  className={`ant-picker-cell-inner ant-picker-calendar-date ${isSelected ? 'ant-picker-cell-selected' : ''}`}
                  style={{ 
                    position: 'relative',
                    color: !isCurrentMonth ? 'rgba(0,0,0,0.25)' : (isSelected ? '#fff' : 'inherit'),
                    background: isSelected ? '#1677ff' : (isToday ? '#e6f4ff' : 'transparent'),
                    borderRadius: 4,
                    margin: '2px',
                    height: 28,
                    lineHeight: '28px',
                    cursor: 'pointer'
                  }}
                >
                  {date.date()}
                  {cellRender(date)}
                </div>
              );
            }}
          />
        </Card>
      </div>

      {/* 右侧：列表 */}
      <div style={{ flex: 1 }}>
        <Card 
          title={getViewTitle()} 
          extra={
            <Space size={16}>
              <Segmented
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { label: '日', value: 'day' },
                  { label: '周', value: 'week' },
                  { label: '月', value: 'month' },
                ]}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                新建日程
              </Button>
            </Space>
          }
          bordered={false}
          style={{ height: "100%", minHeight: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          {loading ? (
            <LoadingState tip="加载日程中..." />
          ) : (
            <List
              locale={{ emptyText: <EmptyState description="此时间段暂无日程安排" /> }}
              dataSource={schedules}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status={dayjs(item.start_time).isBefore(dayjs()) ? "default" : "processing"} />}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        {viewMode !== "day" && (
                          <Text type="secondary" style={{ fontSize: 12, fontWeight: "normal" }}>
                            ({dayjs(item.start_time).format("MM-DD")})
                          </Text>
                        )}
                      </Space>
                    }
                    description={
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(item.start_time).format("HH:mm")}
                        {item.end_time && ` - ${dayjs(item.end_time).format("HH:mm")}`}
                        {item.description && <div style={{ marginTop: 4, color: "rgba(0,0,0,0.45)" }}>{item.description}</div>}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <Modal
        title="新建日程"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="日程标题" rules={[{ required: true }]}>
            <Input placeholder="输入日程标题..." />
          </Form.Item>
          <Form.Item name="time" label="起止时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker showTime style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="可选详细描述..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleList;
