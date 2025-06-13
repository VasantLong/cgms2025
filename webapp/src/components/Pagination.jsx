export function Pagination({ isLoading, onLoadMore }) {
  return (
    <div className="pagination">
      <button onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? "加载中..." : "加载更多"}
      </button>
    </div>
  );
}
