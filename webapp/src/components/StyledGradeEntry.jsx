import styled from "styled-components";
import { Button } from "antd";

export const GradeInputSection = styled.div`
  padding: 20px;

  .ant-table {
    margin-top: 16px;
  }
`;

export const GradeEntryContainer = styled.div`
  padding: 20px;
  height: 100%;
  background-color: hsl(307, 38%, 90%);
`;

export const GradeToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: hsl(307, 38%, 85%);
  border-radius: 4px;

  button {
    background-color: hsl(306, 40%, 25%);
    color: #eee;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: hsl(306, 40%, 35%);
    }

    &:disabled {
      background-color: hsl(307, 38%, 75%);
    }
  }

  .custom-button {
    background-color: hsl(306, 40%, 25%);
    color: #eee;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: hsl(306, 40%, 35%);
    }

    &:disabled {
      background-color: hsl(307, 38%, 75%);
    }

    &.primary {
      // 如果需要对 primary 类型按钮添加额外样式，可在此处添加
    }
  }
`;

export const CustomButton = styled(Button)`
  background-color: hsl(306, 40%, 25%);
  color: #eee;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: hsl(306, 40%, 35%);
  }

  &:disabled {
    background-color: hsl(307, 38%, 75%);
  }
`;

export const GradeCount = styled.div`
  color: hsl(306, 40%, 25%);
  font-size: 14px;
  font-weight: 500;
`;

export const GradeTable = styled.div`
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .ant-table-thead > tr > th {
    background-color: hsl(307, 38%, 85%) !important;
    color: hsl(306, 40%, 25%);
    font-weight: 600;
    border-bottom: 1px solid hsl(307, 38%, 75%);
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid hsl(307, 38%, 80%);
    transition: background-color 0.2s;
  }

  .ant-table-tbody > tr:hover > td {
    background-color: hsl(307, 38%, 95%) !important;
  }

  .ant-input-number {
    width: 100%;
    border: 1px solid hsl(307, 38%, 75%);

    &:hover {
      border-color: hsl(306, 40%, 25%);
    }

    &.ant-input-number-focused {
      box-shadow: 0 0 0 2px rgba(121, 60, 115, 0.2);
      border-color: hsl(306, 40%, 25%);
    }
  }
`;

export const FullTabContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
`;

export const GradeTabContainer = styled.div`
  padding: 20px;
  height: 100%;
`;

export const ImportPreview = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  margin-bottom: 16px;

  table {
    margin-top: 12px;
  }
`;

export const ImportStats = styled.div`
  margin-top: 16px;
`;

export const AntTableRowError = styled.div`
  background-color: #fff1f0;
`;
