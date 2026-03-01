import React from "react";
import { Empty } from "antd";

const EmptyState = ({ description = "暂无数据" }) => (
  <div style={{ padding: "40px 0" }}>
    <Empty description={description} />
  </div>
);

export default EmptyState;
