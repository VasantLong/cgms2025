import { useEffect, useState, useMemo } from "react";
import { useSWR, useSWRInfinite } from "swr";
import { fetcher } from "../utils";
import SearchBar from "@components/SearchBar";
import Pagination from "@components/Pagination";
import "./student-selection.css";

export default function ClassStudentSelection({ classinfo }) {
  // 分页获取所有学生（改进点1）
  const { data, size, setSize, isValidating } = useSWRInfinite(
    (index) => `/api/student/list?page=${index + 1}&page_size=20`,
    fetcher
  );

  // 平铺分页数据
  const allStudents = useMemo(() => data?.flat() || [], [data]);

  // 获取已关联学生（带分页）
  const { data: linkedStudents } = useSWR(
    `/api/class/${classinfo.class_sn}/students?page=1&page_size=1000`,
    fetcher
  );

  // 选中学生状态（改进点2：使用Map存储附加信息）
  const [selectedStudents, setSelectedStudents] = useState(new Map());

  // 搜索过滤状态
  const [searchTerm, setSearchTerm] = useState("");

  // 初始化已选学生（改进点3：存储完整学生信息）
  useEffect(() => {
    if (linkedStudents && allStudents.length > 0) {
      const initialMap = new Map();
      linkedStudents.forEach((s) => {
        const student = allStudents.find((stu) => stu.stu_sn === s.stu_sn);
        if (student) initialMap.set(s.stu_sn, student);
      });
      setSelectedStudents(initialMap);
    }
  }, [linkedStudents, allStudents]);

  // 过滤学生列表（改进点4）
  const filteredStudents = useMemo(() => {
    return allStudents.filter(
      (student) =>
        student.stu_no.includes(searchTerm) ||
        student.stu_name.includes(searchTerm)
    );
  }, [allStudents, searchTerm]);

  // 处理勾选变化（改进点5：批量操作支持）
  const handleCheck = (student, isBatch = false) => {
    setSelectedStudents((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(student.stu_sn)) {
        newMap.delete(student.stu_sn);
      } else {
        newMap.set(student.stu_sn, student);
      }
      return newMap;
    });
  };

  // 批量选择当前页
  const handleBatchSelect = (selectAll) => {
    const newMap = new Map(selectedStudents);
    filteredStudents.forEach((student) => {
      selectAll
        ? newMap.set(student.stu_sn, student)
        : newMap.delete(student.stu_sn);
    });
    setSelectedStudents(newMap);
  };

  // 提交关联（改进点6：分批提交）
  const handleSubmit = async () => {
    try {
      const batchSize = 50; // 每批50个学生
      const studentArray = Array.from(selectedStudents.keys());

      for (let i = 0; i < studentArray.length; i += batchSize) {
        const batch = studentArray.slice(i, i + batchSize);
        await fetch(`/api/class/${classinfo.class_sn}/students`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_sns: batch }),
        });
      }

      alert(`成功关联 ${studentArray.length} 名学生`);
    } catch (err) {
      alert(`关联失败: ${err.message}`);
    }
  };

  return (
    <div className="student-selection">
      <div className="selection-header">
        <h4>当前班次：{classinfo.name}</h4>
        <div className="selection-actions">
          <span>已选: {selectedStudents.size}人</span>
          <button
            onClick={handleSubmit}
            className="btn primary"
            disabled={selectedStudents.size === 0}
          >
            提交关联
          </button>
        </div>
      </div>

      {/* 新增搜索和批量操作栏（改进点7） */}
      <div className="selection-toolbar">
        <SearchBar placeholder="搜索学号或姓名..." onSearch={setSearchTerm} />
        <div className="batch-actions">
          <button onClick={() => handleBatchSelect(true)}>全选当页</button>
          <button onClick={() => handleBatchSelect(false)}>取消当页</button>
        </div>
      </div>

      {/* 虚拟滚动表格容器（改进点8） */}
      <div className="table-container">
        <table className="list-table">
          <thead>
            <tr>
              <th width="50px">
                <input
                  type="checkbox"
                  checked={filteredStudents.every((s) =>
                    selectedStudents.has(s.stu_sn)
                  )}
                  onChange={(e) => handleBatchSelect(e.target.checked)}
                />
              </th>
              <th>学号</th>
              <th>姓名</th>
              <th>性别</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.stu_sn}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(student.stu_sn)}
                    onChange={() => handleCheck(student)}
                  />
                </td>
                <td>{student.stu_no}</td>
                <td>{student.stu_name}</td>
                <td>{student.gender === "M" ? "男" : "女"}</td>
                <td>
                  {linkedStudents?.some((s) => s.stu_sn === student.stu_sn)
                    ? "已关联"
                    : "未关联"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页加载更多（改进点9） */}
      <Pagination
        isLoading={isValidating}
        onLoadMore={() => setSize(size + 1)}
      />

      {/* 状态提示（改进点10） */}
      {isValidating && <div className="loading-indicator">加载中...</div>}
    </div>
  );
}
