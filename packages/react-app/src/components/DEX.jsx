import { Card, Col, Divider, Input, Row } from "antd";
import { useBalance, useContractReader, useBlockNumber } from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useTokenBalance } from "eth-hooks/erc/erc-20/useTokenBalance";
import { ethers } from "ethers";
import React, { useState } from "react";
import Address from "./Address";
import Contract from "./Contract";
import Curve from "./Curve";
import TokenBalance from "./TokenBalance";
import Blockies from "react-blockies";

const contractName = "DEX";
const tokenName = "Balloons";

export default function Dex(props) {
  let display = [];

  const [form, setForm] = useState({});
  const [values, setValues] = useState({});
  const tx = props.tx;

  const writeContracts = props.writeContracts;

  const contractAddress = props.readContracts[contractName].address;
  const tokenAddress = props.readContracts[tokenName].address;
  const contractBalance = useBalance(props.localProvider, contractAddress);

  const tokenBalance = useTokenBalance(props.readContracts[tokenName], contractAddress, props.localProvider);
  const tokenBalanceFloat = parseFloat(ethers.utils.formatEther(tokenBalance));
  const ethBalanceFloat = parseFloat(ethers.utils.formatEther(contractBalance));
  const liquidity = useContractReader(props.readContracts, contractName, "totalLiquidity");

  const rowForm = (title, icon, onClick) => {
    return (
      <Row>
        <Col span={8} style={{ textAlign: "right", opacity: 0.333, paddingRight: 6, fontSize: 24 }}>
          {title}
        </Col>
        <Col span={16}>
          <div style={{ cursor: "pointer", margin: 2 }}>
            <Input
              onChange={e => {
                let newValues = { ...values };
                newValues[title] = e.target.value;
                setValues(newValues);
              }}
              value={values[title]}
              addonAfter={
                <div
                  type="default"
                  onClick={() => {
                    onClick(values[title]);
                    let newValues = { ...values };
                    newValues[title] = "";
                    setValues(newValues);
                  }}
                >
                  {icon}
                </div>
              }
            />
          </div>
        </Col>
      </Row>
    );
  };

  if (props.readContracts && props.readContracts[contractName]) {
    display.push(
      <div>
        {rowForm("ETH To Balloons", "💸 buy", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let valuePlusExtra = ethers.utils.parseEther("" + value * 1.03);
          console.log("valuePlusExtra", valuePlusExtra);
          let swapEthToTokenResult = await tx(writeContracts[contractName]["ethToToken"]({ value: valuePlusExtra }));
          console.log("swapEthToTokenResult:", swapEthToTokenResult);
        })}

        {rowForm("Balloons To Eth", "🔏 sell", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          console.log("valueInEther", valueInEther);
          let valuePlusExtra = ethers.utils.parseEther("" + value * 1.03);
          console.log("valuePlusExtra", valuePlusExtra);
          let allowance = await props.readContracts[tokenName].allowance(
            props.address,
            props.readContracts[contractName].address,
          );
          console.log("allowance", allowance);

          let approveTx;
          if (allowance.lt(valuePlusExtra)) {
            approveTx = await tx(
              writeContracts[tokenName].approve(props.readContracts[contractName].address, valuePlusExtra, {
                gasLimit: 200000,
              }),
            );
          }

          let swapTx = tx(writeContracts[contractName]["tokenToEth"](valuePlusExtra, { gasLimit: 200000 }));
          if (approveTx) {
            console.log("waiting on approve to finish...");
            let approveTxResult = await approveTx;
            console.log("approveTxResult:", approveTxResult);
          }
          let swapTxResult = await swapTx;
          console.log("swapTxResult:", swapTxResult);
        })}

        <Divider> Liquidity ({liquidity ? ethers.utils.formatEther(liquidity) : "none"}):</Divider>

        {rowForm("Add Liquidity", "Deposit 📥 ", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let allowance = await props.readContracts[tokenName].allowance(
            props.address,
            props.readContracts[contractName].address,
          );
          console.log("allowance", allowance);
          if (allowance.lt(valueInEther)) {
            await tx(
              writeContracts[tokenName].approve(props.readContracts[contractName].address, valueInEther, {
                gasLimit: 200000,
              }),
            );
          }
          await tx(writeContracts[contractName]["deposit"]({ value: valueInEther, gasLimit: 200000 }));
        })}

        {rowForm("Rem Liquidity ", "Withdraw 📤 ", async value => {
          let valueInEther = ethers.utils.parseEther("" + value);
          let withdrawTxResult = await tx(writeContracts[contractName]["withdraw"](valueInEther));
          console.log("withdrawTxResult:", withdrawTxResult);
        })}
      </div>,
    );
  }

  return (
    <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
    <Row >
      <Col >
        <Card
          title={
            <div>
              <Address value={contractAddress} />
              <div style={{ float: "right", fontSize: 24 }}>
                {parseFloat(ethers.utils.formatEther(contractBalance)).toFixed(4)} ⚖️
                <TokenBalance name={tokenName} img={"🎈"} address={contractAddress} contracts={props.readContracts} />
              </div>
            </div>
          }
          size="large"
          loading={false}
        >
          {display}
        </Card>
        <Row >
          <Contract
            name="Balloons"
            signer={props.signer}
            provider={props.localProvider}
            show={["balanceOf", "approve"]}
            address={props.address}
            blockExplorer={props.blockExplorer}
            contractConfig={props.contractConfig}
          />
        </Row>
        <Row>
          <Col  style={{ textAlign: "right", opacity: 0.333, paddingRight: 6, paddingTop:30, fontSize: 24 }}>
            Price Model Graph
          </Col>
        </Row>
        <Row>
          <Col  style={{ textAlign: "right", opacity: 0.333, paddingRight: 6, fontSize: 16 }}>
            Blue point = amount of ETH in DEX by amount of Balloons in DEX
          </Col>
        </Row>
        
        <Row>
          <Curve
              addingEth={values && values["ethToToken"] ? values["ethToToken"] : 0}
              addingToken={values && values["tokenToEth"] ? values["tokenToEth"] : 0}
              ethReserve={ethBalanceFloat}
              tokenReserve={tokenBalanceFloat}
              width={500}
              height={500}
            />
        </Row>
      </Col>
      {/* <Col span={12}>
        <div style={{ padding: 20 }}>
          <Curve
            addingEth={values && values["ethToToken"] ? values["ethToToken"] : 0}
            addingToken={values && values["tokenToEth"] ? values["tokenToEth"] : 0}
            ethReserve={ethBalanceFloat}
            tokenReserve={tokenBalanceFloat}
            width={500}
            height={500}
          />
        </div>
      </Col> */}
    </Row>
    </div>
  );
}
