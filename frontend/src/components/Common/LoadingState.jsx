import React from "react";
import { Spin } from "antd";

const LoadingState = ({ tip = "加载中..." }) => (
  <div style={{ textAlign: "center", padding: "40px 0" }}>
    <Spin tip={tip} />
  </div>
);

export default LoadingState;
