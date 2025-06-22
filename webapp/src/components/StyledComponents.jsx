import styled from "styled-components";

// 从 StyledStudentSelection 移入的组件
export const StudentSelection = styled.div`
  padding: 20px;
`;

export const SelectionToolbar = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

// 对应 .selection-header 样式
export const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

export const TableContainer = styled.div`
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #eee;
`;

export const ListTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHeaderCell = styled.th`
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: #f5f5f5;
`;

export const TableDataCell = styled.td`
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
`;

export const DisabledCheckbox = styled.input.attrs({ type: "checkbox" })`
  opacity: 0.5;
  cursor: not-allowed;
`;

// 从 StyledClass 移入的组件
export const GeneratedValue = styled.div`
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f5f5f5;
  color: #666;
`;

export const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #eee;
  margin: 0 -20px;
  padding: 0 20px;
`;

export const Tab = styled.button`
  padding: 12px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;

  &.active {
    border-bottom-color: hsl(329, 45%, 38%);
    color: hsl(329, 45%, 38%);
    font-weight: 500;
  }
`;

export const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

// 对应 .empty-table 样式
export const EmptyTable = styled.div`
  text-align: center;
  padding: 20px;
  color: #888;
`;

// 对应 .loading-indicator 样式
export const LoadingIndicator = styled.div`
  padding: 10px;
  text-align: center;
  color: hsl(329, 45%, 38%);
`;

// 对应 .conflict-tooltip 样式
export const ConflictTooltip = styled.span`
  margin-left: 4px;
  color: #ff4d4f;
  cursor: help;
`;

// 对应 .conflict-row 样式
export const ConflictRow = styled.tr`
  background-color: #fff2f0;
`;
