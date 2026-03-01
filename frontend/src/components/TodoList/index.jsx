import React, { useState, useEffect } from "react";
import { List, Checkbox, Button, Input, Form, Typography, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { getTodos, createTodo, updateTodoStatus, deleteTodo } from "../../api/todoApi";
import LoadingState from "../Common/LoadingState";
import EmptyState from "../Common/EmptyState";

const { Text } = Typography;

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const data = await getTodos();
      setTodos(data);
    } catch (error) {
      message.error("加载待办失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleAddTodo = async (values) => {
    try {
      await createTodo(values);
      form.resetFields();
      message.success("添加成功");
      fetchTodos();
    } catch (error) {
      message.error("添加失败");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "pending" ? "completed" : "pending";
      await updateTodoStatus(id, newStatus);
      setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      message.error("更新状态失败");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id);
      message.success("已删除");
      fetchTodos();
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Typography.Title level={4}>待办事项</Typography.Title>
      
      <Form form={form} onFinish={handleAddTodo} layout="inline" style={{ marginBottom: 24 }}>
        <Form.Item name="title" rules={[{ required: true, message: "请输入待办标题" }]} style={{ flex: 1 }}>
          <Input placeholder="添加一个待办事项..." prefix={<PlusOutlined />} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">添加</Button>
        </Form.Item>
      </Form>

      {loading ? (
        <LoadingState tip="正在获取您的待办..." />
      ) : (
        <List
          locale={{ emptyText: <EmptyState description="暂无待办事项，快去添加一个吧" /> }}
          dataSource={todos}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDelete(item.id)} 
                />
              ]}
            >
              <Checkbox 
                checked={item.status === "completed"} 
                onChange={() => handleToggleStatus(item.id, item.status)}
              >
                <Text delete={item.status === "completed"} style={{ marginLeft: 8 }}>
                  {item.title}
                </Text>
              </Checkbox>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default TodoList;
