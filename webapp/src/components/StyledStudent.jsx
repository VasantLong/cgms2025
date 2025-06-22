import styled from "styled-components";

export const StatsHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
`;

export const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

export const GrayText = styled.span`
  color: #999;
`;

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

export const StatsSummary = styled.span`
  color: #666;
  line-height: 32px;
  padding: 0 12px;
`;

export const Muted = styled.span`
  color: #999;
`;
