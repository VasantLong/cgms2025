import { useState } from "react";
import StyledButton from "./StyledButton";

export function SearchBar({ placeholder, onSearch }) {
  const [input, setInput] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(input);
  };

  return (
    <form onSubmit={handleSearch} className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <StyledButton type="submit">搜索</StyledButton>
    </form>
  );
}
