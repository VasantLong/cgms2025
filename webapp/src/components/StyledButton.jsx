import styled from "styled-components";

// 定义基础按钮样式
const StyledButton = styled.button`
  color: #fff;
  background-color: hsl(329, 45%, 38%);
  border-color: hsl(329, 45%, 38%);
  width: fit-content;
  font-weight: bold;
  padding: 0.2em 1em;
  border: 1px solid transparent;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  letter-spacing: 0.1em;
  user-select: none;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px); // 悬停时上移
    background-color: hsl(329, 45%, 30%); // 悬停时颜色变深
    border-color: hsl(329, 45%, 30%);
  }

  &:disabled {
    background-color: hsl(329, 45%, 80%);
    border-color: hsl(329, 45%, 80%);
    cursor: not-allowed;
    box-shadow: none; // 禁用时移除阴影
  }

  &:active {
    transform: translateY(1px); // 点击时下移
  }

  & > a:visited,
  & > a:link {
    color: #fff;
    text-decoration: none;
  }

  & > form {
    margin: unset;
  }

  & > form > input[type="submit"] {
    background-color: unset;
    border: unset;
    color: unset;
    font-size: unset;
    padding: unset;
    appearance: none;
    font-weight: bold;
    cursor: pointer;

    &:focus {
      outline: none;
    }
  }

  &-& {
  }
`;

export default StyledButton;
