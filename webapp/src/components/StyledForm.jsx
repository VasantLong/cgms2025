import styled, { css } from "styled-components";

export const FormField = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  gap: ${({ theme }) => theme.spacing.sm};

  /* 修复1：使用标准CSS注释 */
  & label {
    width: ${({ theme }) => theme.form?.labelWidth || "6em"}; /* 添加默认值 */
    color: ${({ theme }) => theme.colors.primary};
    min-width: 120px;
    font-weight: 500;
    text-align: right;
    margin-right: ${({ theme }) => theme.spacing.sm};
    flex-shrink: 0;
  }

  /* 修复嵌套选择器 */
  & input:not([type="radio"]):not([type="checkbox"]),
  & select,
  & textarea {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.sm}
      ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    transition: all 0.3s;
  }

  /* 通用输入控件 */
  & input:not([type="radio"]):not([type="checkbox"]),
  & select,
  & textarea {
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.secondary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.secondary}20;
    }

    &.error {
      border-color: ${({ theme }) => theme.colors.error};
    }
  }

  /*使用更具体的选择器覆盖全局样式*/
  && .radio-choices {
    flex: 1;
    display: flex;
    justify-content: space-around;

    .option {
      display: flex;
      align-items: center;

      input[type="radio"] {
        margin-left: 1em;
        accent-color: ${({ theme }) => theme.colors.secondary};
      }
    }
  }

  .generated-value {
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #f5f5f5;
    color: #666;
  }
`;

// 创建独立的RadioGroup组件
export const RadioGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: center;
`;

// 创建独立的FormLabel组件
export const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: ${({ theme }) => theme.colors.secondary};
  }
`;
