import styled from "styled-components";

// 定义 Table 组件
export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  margin: ${({ theme }) => theme.spacing.md} 0 & th {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    padding: ${({ theme }) => theme.spacing.sm}
      ${({ theme }) => theme.spacing.md};
  }

  th,
  td {
    min-width: 5em;
  }

  tr {
    line-height: 2;
  }

  thead > tr:first-child {
    background-color: hsl(306, 40%, 20%);
    color: #fff;
    line-height: 2.5;
  }

  tr:hover {
    background-color: hsl(60, 100%, 85%);
  }

  tr:nth-child(odd) {
    background-color: hsl(306, 40%, 100%);
  }

  tr:nth-child(even) {
    background-color: hsl(306, 40%, 90%);
  }
`;
