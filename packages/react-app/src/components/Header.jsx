import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://github.com/austintgriffith/scaffold-eth" target="_blank" rel="noopener noreferrer">
      <PageHeader
        title="easyToken DEX"
        subTitle="a first intent of Automated Market Make to trade Ballons and ETH tokens"
        style={{ cursor: "pointer" }}
      />
    </a>
  );
}
