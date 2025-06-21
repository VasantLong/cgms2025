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
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  letter-spacing: 0.1em;
  user-select: none;
  cursor: pointer;

  &:disabled {
    background-color: hsl(329, 45%, 80%);
    border-color: hsl(329, 45%, 80%);
    cursor: not-allowed;
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
`;

export default StyledButton;
