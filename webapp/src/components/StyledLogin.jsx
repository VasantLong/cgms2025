import styled from "styled-components";

export const LoginRoot = styled.div`
  display: flex;
  min-height: 100vh;
  margin: 0;
  background-color: hsl(307, 38%, 90%);
`;

export const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  padding: 2.5rem 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px hsl(307, 38%, 21% / 0.15);
  width: 28rem;
  animation: fadeIn 0.5s;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const LoginHeader = styled.div`
  h2 {
    color: hsl(306, 40%, 25%);
    font-size: 1.8rem;
    text-align: center;
    margin-bottom: 1.5rem;
    letter-spacing: 0.1em;
    font-weight: bold;
    position: relative;

    &::after {
      content: "";
      display: block;
      width: 100%;
      height: 3px;
      background: hsl(329, 45%, 38%);
      margin: 0.5rem auto 0;
      transform: scaleX(0.5);
      transform-origin: center;
      transition: transform 0.3s;
    }
  }
`;

export const Field = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: hsl(306, 40%, 30%);
    font-size: 0.9rem;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid hsl(307, 38%, 70%);
    border-radius: 4px;
    font-size: 1rem;
    transition: border 0.3s;

    &:focus {
      outline: none;
      border-color: hsl(329, 45%, 38%);
      box-shadow: 0 0 0 2px hsl(329, 45%, 38% / 0.2);
    }
  }
`;

export const LoginButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: hsl(329, 45%, 38%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background-color: hsl(329, 45%, 30%);
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  padding: 0.5rem;
  background: #fde8e8;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;
