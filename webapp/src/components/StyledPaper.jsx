import styled from "styled-components";
import { StyledTable } from "./StyledTable";

// 定义 Paper 组件
const Paper = styled.div`
  box-shadow: 4px 5px 4px 2px #aaa;
  padding: 2em;
  border-style: solid;
  border-width: 1px;
  border-color: #eee;
  background-color: #fff;
  min-height: 50vh;
  margin: 1em 2em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  animation: fadeInDown;
  animation-duration: 0.8s;
`;

// 定义 PaperHead 组件
const PaperHead = styled.div`
  min-height: 2rem;
  margin-bottom: 5px;
`;

// 定义 PaperBody 组件
const PaperBody = styled.div`
  flex: 1 1;

  > ${StyledTable} {
    width: 100%;
  }
`;

const PaperFooter = styled.div`
  min-height: 2rem;
  margin-top: 5px;
`;

// 定义 StatusBar 组件
const StatusBar = styled.div`
  position: absolute;
  top: 2em;
  margin: auto;
  display: flex;
  justify-content: center;
  left: 2em;
  right: 1em;
`;

// 定义 Message 组件
const Message = styled.div`
  line-height: 2;
  padding: 0.1em 2em;
  background-color: #ffd70078;
  color: #555;
`;

// 定义 ErrorMessage 组件
const ErrorMessage = styled(Message)`
  display: flex;
`;

// 定义 ErrorButton 组件
const ErrorButton = styled.button`
  margin-right: -2em;
  background-color: transparent;
  border: navajowhite;
  width: 2.5em;
  font-size: 1.2em;
  color: #6f6fb7;
  cursor: pointer;
`;

export {
  Paper,
  PaperHead,
  PaperBody,
  PaperFooter,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
};
