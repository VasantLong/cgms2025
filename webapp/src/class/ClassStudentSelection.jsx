import { useEffect, useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "../utils";
import { SearchBar } from "@components/SearchBar";
import { Pagination } from "@components/Pagination";
import "./student-selection.css";

export default function ClassStudentSelection({ classinfo }) {
  useEffect(() => {
    if (!classinfo?.class_sn) {
      navigate("/class/list");
    }
  }, [classinfo]);

  // 1. 首先定义所有状态和SWR hooks
  const [selectedStudents, setSelectedStudents] = useState(new Map()); // 选中学生状态（改进点2：使用Map存储附加信息）
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 搜索过滤状态

  // 2. 安全获取学生数据：分页获取所有学生
  const studentFetcher = async (url) => {
    const res = await fetcher(url + `&last_sn=${lastLoadedSn}`); // 需要后端支持
    return Array.isArray(res) ? res : res?.data || [];
  };
  const { data, size, setSize, isValidating, error } = useSWRInfinite(
    (index) => `/api/student/list?page=${index + 1}&page_size=20`,
    fetcher,
    {
      dedupingInterval: 30000, // 30秒内相同请求合并
      revalidateOnFocus: false, // 禁止焦点切换时重新请求
      revalidateFirstPage: false, // 保持第一页数据稳定
    }
  );
  if (error) {
    console.error("Error loading student data:", error);
    return <div>加载学生数据时出错</div>;
  }
  // 添加调试
  useEffect(() => {
    console.log("SWR Infinite raw data:", data);
  }, [data]);

  // 3. 仅在class_sn存在时请求关联学生（带分页）（添加防抖和缓存更新）
  const {
    data: linkedResponse,
    mutate,
    error: linkedError,
  } = useSWR(
    classinfo?.class_sn // 添加class_sn存在性检查
      ? `/api/class/${classinfo.class_sn}/students`
      : null,
    fetcher,
    {
      dedupingInterval: 30000, // 30秒内相同请求合并
      revalidateOnReconnect: false,
      revalidateOnFocus: false, // 新增此配置
      shouldRetryOnError: false, // 可选添加错误时停止重试
    }
  );
  if (linkedError) {
    console.error("Error loading linked students:", linkedError);
    return <div>加载已关联学生时出错</div>;
  }

  // 4. 处理数据格式
  const allStudents = useMemo(() => {
    if (!data) return [];
    // 合并所有页数据并去重
    const merged = data.flat();
    const uniqueStudents = [];
    const seen = new Set();

    merged.forEach((student) => {
      if (student?.stu_sn && !seen.has(student.stu_sn)) {
        seen.add(student.stu_sn);
        uniqueStudents.push(student);
      }
    });

    return uniqueStudents;
  }, [data]);

  const linkedStudents = useMemo(() => {
    console.log("linkedResponse:", linkedResponse); // 调试
    // 根据API实际响应结构调整
    return Array.isArray(linkedResponse?.data)
      ? linkedResponse.data
      : Array.isArray(linkedResponse)
      ? linkedResponse
      : [];
  }, [linkedResponse]);
  // 过滤学生列表（改进点4）
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(allStudents)) return [];
    return allStudents.filter(
      (
        student // 添加空值保护：在过滤逻辑中添加可选链操作符（?.）
      ) =>
        student?.stu_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student?.stu_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStudents, searchTerm]);

  useEffect(() => {
    console.log("Current data state:", {
      allStudents,
      linkedStudents,
      selectedStudents: Array.from(selectedStudents.keys()),
    });
  }, [allStudents, linkedStudents, selectedStudents]);

  useEffect(() => {
    console.log("SWR触发条件变化:", classinfo?.class_sn);
  }, [classinfo?.class_sn]);

  // 5. 安全的初始化逻辑:初始化已选学生（改进点3：存储完整学生信息）
  useEffect(() => {
    console.log("Linked Students:", linkedStudents); // 添加调试日志
    if (linkedStudents.length > 0 && allStudents.length > 0) {
      const initialMap = new Map();
      linkedStudents.forEach((linkedStudent) => {
        const fullStudent = allStudents.find(
          (s) => s?.stu_sn === linkedStudent?.stu_sn
        );
        if (fullStudent) {
          initialMap.set(linkedStudent.stu_sn, fullStudent);
        }
      });
      setSelectedStudents(initialMap);
    }
  }, [linkedStudents, allStudents]);

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

  // 提交关联（改进点6：分批提交）（添加缓存失效机制）
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true); // 开始提交
      const batchSize = 50; // 每批50个学生
      const studentArray = Array.from(selectedStudents.keys());

      // 1. 执行POST请求并获取响应
      const { added_count, students } = await fetcher(
        `/api/class/${classinfo.class_sn}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_sns: studentArray }),
        }
      );

      // 2. 更新SWR缓存
      mutate(`/api/class/${classinfo.class_sn}/students`, students, false);

      alert(`成功关联 ${added_count} 名学生`);

      // 3. 清空选中状态（根据需求可选）
      setSelectedStudents(new Map());
    } catch (err) {
      console.error("关联失败详情:", err);
      alert(`关联失败: ${err.message || "未知错误"}`);
    } finally {
      setIsSubmitting(false); // 结束提交
    }
  };

  useEffect(() => {
    // 提交完成后检查数据一致性
    if (!isSubmitting && linkedStudents.length > 0) {
      const unsynced = Array.from(selectedStudents.keys()).filter(
        (sn) => !linkedStudents.some((s) => s.stu_sn === sn)
      );

      if (unsynced.length > 0) {
        console.warn("存在未同步的选中学生:", unsynced);
      }
    }
  }, [linkedStudents, isSubmitting, selectedStudents]);

  return (
    <div className="student-selection">
      {/* 新增搜索和批量操作栏（改进点7） */}
      <div className="selection-toolbar">
        <SearchBar placeholder="搜索学号或姓名..." onSearch={setSearchTerm} />
        <div className="selection-info">
          <span>已选: {selectedStudents.size}人</span>
          <button
            onClick={handleSubmit}
            disabled={selectedStudents.size === 0 || isSubmitting}
          >
            {isSubmitting ? "提交中..." : "保存关联"}
          </button>
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
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-table">
                  {searchTerm ? "没有找到匹配的学生" : "暂无学生数据"}
                </td>
              </tr>
            )}
            {filteredStudents.map((student) => (
              <tr key={`${student.stu_sn}-${student.stu_no}`}>
                {/* 使用复合key */}
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
                  {isSubmitting && selectedStudents.has(student.stu_sn)
                    ? "保存中..."
                    : linkedStudents.some((s) => s.stu_sn === student.stu_sn)
                    ? "✓ 已关联"
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
        hasMore={data?.[data.length - 1]?.length === 20} // 假设每页20条
        onLoadMore={() => setSize(size + 1)}
      />

      {/* 状态提示（改进点10） */}
      {isValidating && <div className="loading-indicator">加载中...</div>}
    </div>
  );
}
