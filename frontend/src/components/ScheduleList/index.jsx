import React, { useState, useEffect, useCallback } from "react";
import { Calendar, List, Card, Badge, Button, Modal, Form, Input, DatePicker, message } from "antd";
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { getSchedules, createSchedule, deleteSchedule } from "../../api/scheduleApi";
import LoadingState from "../Common/LoadingState";
import EmptyState from "../Common/EmptyState";
import dayjs from "dayjs";

const ScheduleList = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSchedules({
        startTime: selectedDate.startOf("day").format("YYYY-MM-DD HH:mm:ss"),
        endTime: selectedDate.endOf("day").format("YYYY-MM-DD HH:mm:ss"),
      });
      setSchedules(data);
    } catch (error) {
      message.error("加载日程失败");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
    } catch (error) {
      message.error("创建失败");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSchedule(id);
      message.success("已删除");
      fetchSchedules();
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, height: "100%" }}>
      <div style={{ width: 300 }}>
        <Card size="small" title="迷你日历" bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Calendar 
            fullscreen={false} 
            value={selectedDate} 
            onChange={setSelectedDate} 
            headerRender={() => null} // Custom header if needed
          />
        </Card>
      </div>

      <div style={{ flex: 1 }}>
        <Card 
          title={`${selectedDate.format("MM月DD日")} 日程概览`} 
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>新建日程</Button>}
          bordered={false}
          style={{ height: "100%", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          {loading ? (
            <LoadingState tip="加载日程中..." />
          ) : (
            <List
              locale={{ emptyText: <EmptyState description="今日暂无日程安排" /> }}
              dataSource={schedules}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status="processing" />}
                    title={item.title}
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
