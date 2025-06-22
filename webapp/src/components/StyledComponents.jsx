import styled from "styled-components";
import { Pagination as AntPagination } from "antd";
console.log(AntPagination); // 打印 AntPagination 查看其结构

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

// 分页容器样式
export const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  justify-content: center;
`;

// 分页按钮样式
export const PaginationButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: hsl(329, 45%, 38%);
    border-color: hsl(329, 45%, 38%);
  }

  &:disabled {
    color: rgba(0, 0, 0, 0.25);
    border-color: #d9d9d9;
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

// 分页选择框样式
export const PaginationSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: hsl(329, 45%, 38%);
    box-shadow: 0 0 0 2px hsla(329, 45%, 38%, 0.2); // 使用相同颜色并设置透明度
  }
`;

export const StyledAntPagination = styled(AntPagination)`
  .ant-pagination-item {
    ${PaginationButton}
    background: white;
    border: 1px solid #d9d9d9;
    &:hover {
      color: hsl(329, 45%, 38%);
      border-color: hsl(329, 45%, 38%);
      background: white;
    }
    &.ant-pagination-item-active {
      border-color: hsl(329, 45%, 38%);
      color: hsl(329, 45%, 38%);
      font-weight: 500;

      a {
        color: hsl(329, 45%, 38%);
      }
    }
  }

  .ant-pagination-prev,
  .ant-pagination-next {
    ${PaginationButton}
    background: white;
    border: 1px solid #d9d9d9;
    &:hover {
      color: hsl(329, 45%, 38%);
      border-color: hsl(329, 45%, 38%);
      background: white;
    }
    &.ant-pagination-disabled {
      color: rgba(0, 0, 0, 0.25);
      border-color: #d9d9d9;
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  }

  .ant-pagination-options-size-changer {
    ${PaginationSelect}
    .ant-select-selector {
      border-color: hsl(329, 45%, 38%) !important; // 设置选择框边框颜色
    }
    // 聚焦时的边框和阴影
    &.ant-select-focused .ant-select-selector {
      border-color: hsl(329, 45%, 38%) !important;
      box-shadow: 0 0 0 2px hsla(329, 45%, 38%, 0.2) !important; // 使用相同颜色并设置透明度
    }

    // 下拉菜单选项选中时的背景颜色，参考原生的透明度
    .ant-select-dropdown
      .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
      background-color: hsla(329, 45%, 38%, 0.1); // 设置较低的透明度
      color: hsl(329, 45%, 38%);
    }

    // 下拉菜单选项 hover 时的背景颜色
    .ant-select-dropdown
      .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
      background-color: hsla(329, 45%, 38%, 0.06); // 设置更低的透明度
    }

    // 页数选择按钮 hover 时的样式
    &:hover .ant-select-selector {
      border-color: hsl(329, 45%, 38%) !important;
      box-shadow: 0 0 0 2px hsla(329, 45%, 38%, 0.2) !important;
    }
  }
`;

// 新增选项卡样式
export const StatsHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
`;

// 统计卡片布局
export const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

// 表格样式
export const GrayText = styled.span`
  color: #999;
`;

// 导出按钮组
export const ExportButtons = styled.div`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
`;

export const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const StatsSummary = styled.div`
  color: #666;
  line-height: 32px;
  padding: 0 12px;
`;

export const Muted = styled.span`
  color: #999;
`;
