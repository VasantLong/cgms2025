import { useEffect, useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "../utils";
import { SearchBar } from "@components/SearchBar";
import { Pagination } from "@components/Pagination";
import "./student-selection.css";
import { message } from "antd";

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
  const [hasChanges, setHasChanges] = useState(false); // 是否修改状态
  const [conflictStudents, setConflictStudents] = useState(new Set()); // 存储冲突学生的stu_sn
  const [initialSelected, setInitialSelected] = useState(new Set());
  const [lastSubmitted, setLastSubmitted] = useState(new Set());

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
    //调试
    console.log("Current data state:", {
      allStudents,
      linkedStudents,
      selectedStudents: Array.from(selectedStudents.keys()),
    });
  }, [allStudents, linkedStudents, selectedStudents]);

  useEffect(() => {
    //调试
    console.log("SWR触发条件变化:", classinfo?.class_sn);
  }, [classinfo?.class_sn]);

  // 替换原来的可用学生获取逻辑
  const availableStudents = useMemo(() => {
    const linkedSnSet = new Set(linkedStudents.map((s) => s.stu_sn));
    return allStudents.filter((s) => !linkedSnSet.has(s.stu_sn));
  }, [allStudents, linkedStudents]);

  // 处理冲突学生
  const checkConflicts = async (studentSns) => {
    if (!classinfo?.class_sn || studentSns.length === 0) return;

    try {
      // 将数组转换为多个student_sns参数
      const params = new URLSearchParams();
      studentSns.forEach((sn) => params.append("student_sns", sn));
      const conflicts = await fetcher(
        `/api/class/${
          classinfo.class_sn
        }/students/conflicts?${params.toString()}`
      );
      // 提取冲突学生的stu_sn并存入Set
      const conflictSnSet = new Set(conflicts.map((s) => s.stu_sn));
      setConflictStudents(conflictSnSet);
    } catch (err) {
      console.error("检查冲突失败:", err);
      message.error("检查学生冲突时出错");
    }
  };

  // 5. 初始化已选学生
  useEffect(() => {
    if (linkedStudents.length > 0 && allStudents.length > 0) {
      console.log("初始化选中状态", { linkedStudents, allStudents });
      const initialMap = new Map();
      const initialSnSet = new Set();
      linkedStudents.forEach((linked) => {
        // 精确匹配学生（确保sn和no都匹配）
        const fullStudent = allStudents.find(
          (s) => s?.stu_sn === linked?.stu_sn && s?.stu_no === linked?.stu_no
        );
        if (fullStudent) {
          initialMap.set(linked.stu_sn, fullStudent);
          initialSnSet.add(linked.stu_sn);
        } else {
          console.warn("未找到匹配的完整学生信息", linked);
        }
      });
      setSelectedStudents(initialMap);
      setInitialSelected(initialSnSet);
      setLastSubmitted(new Set(initialSnSet));
      setHasChanges(false); // 初始化时无修改
      console.log("初始化后的selectedStudents", Array.from(initialMap.keys()));
    }
  }, [linkedStudents, allStudents]);

  // 冲突学生
  useEffect(() => {
    if (allStudents.length > 0 && classinfo?.class_sn) {
      const studentSns = allStudents.map((s) => s.stu_sn);
      checkConflicts(studentSns);
    }
  }, [allStudents, classinfo?.class_sn]);

  // 监听选中变化
  useEffect(() => {
    const currentSelected = new Set(selectedStudents.keys());
    const isChanged =
      currentSelected.size !== initialSelected.size ||
      Array.from(currentSelected).some((sn) => !initialSelected.has(sn)) ||
      Array.from(initialSelected).some((sn) => !currentSelected.has(sn));

    setHasChanges(isChanged);
  }, [selectedStudents, initialSelected]);

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
      if (conflictStudents.has(student.stu_sn)) return;
      selectAll
        ? newMap.set(student.stu_sn, student)
        : newMap.delete(student.stu_sn);
    });
    setSelectedStudents(newMap);
  };

  // 提交关联（改进点6：分批提交）（添加缓存失效机制）
  const handleSubmit = async () => {
    if (!hasChanges) {
      message.warning("未检测到修改内容");
      return;
    }

    // 检查是否有选中的冲突学生
    const selectedConflictStudents = Array.from(selectedStudents.keys()).filter(
      (sn) => conflictStudents.has(sn)
    );

    if (selectedConflictStudents.length > 0) {
      message.error("不能提交包含冲突学生的选择");
      return;
    }

    try {
      setIsSubmitting(true); // 开始提交
      const batchSize = 50; // 每批50个学生
      const student_sns = Array.from(selectedStudents.keys());

      // 1. 执行PUT请求并获取响应
      const response = await fetcher(
        `/api/class/${classinfo.class_sn}/students`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_sns: student_sns }),
        }
      );

      const currentSelected = new Set(selectedStudents.keys());
      const added = Array.from(currentSelected).filter(
        (sn) => !lastSubmitted.has(sn)
      );
      const removed = Array.from(lastSubmitted).filter(
        (sn) => !currentSelected.has(sn)
      );

      // 2. 更新SWR缓存
      if (response.conflicts && response.conflicts.length > 0) {
        const conflictList = response.conflicts
          .map((s) => `${s.stu_name}(${s.stu_no}) - 已关联: ${s.class_no}`)
          .join("\n");
        message.error(`无法关联以下学生:\n${conflictList}`);
        await mutate(); // 刷新数据
      } else {
        message.success(
          `更新成功！\n新增: ${response.added.length}人\n` +
            `移除: ${response.removed.length}人\n` +
            `当前关联: ${response.total_count}人`
        );
        setLastSubmitted(new Set(selectedStudents.keys()));
        await mutate(
          `/api/class/${classinfo.class_sn}/students`,
          response.students,
          false
        );
      }
      // 3. 清空选中状态（根据需求可选）
      setSelectedStudents(
        new Map(response.students?.map((s) => [s.stu_sn, s]) || [])
      );
    } catch (err) {
      if (err.info?.detail?.message === "部分学生已关联到本课程的其他班次") {
        const conflictNames = err.info.detail.conflicts
          .map((s) => `${s.stu_name}(${s.stu_no}) - 已关联班次: ${s.class_no}`)
          .join("\n");
        message.error(
          `无法关联以下学生:\n${conflictNames}\n\n一个学生只能关联到同一课程的一个班次`
        );
      } else {
        message.error(`关联失败: ${err.message || "未知错误"}`);
      }
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
            disabled={!hasChanges || isSubmitting} // 无修改时禁用
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
                  checked={
                    filteredStudents.length > 0 &&
                    filteredStudents.every(
                      (s) =>
                        selectedStudents.has(s.stu_sn) ||
                        conflictStudents.has(s.stu_sn)
                    )
                  }
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
            {filteredStudents.map((student) => {
              const isConflict = conflictStudents.has(student.stu_sn);
              const isLinked = linkedStudents.some(
                (s) => s.stu_sn === student.stu_sn
              );
              const isSelected = selectedStudents.has(student.stu_sn);

              return (
                <tr
                  key={`${student.stu_sn}-${student.stu_no}`}
                  /* 使用复合key */
                  className={isConflict ? "conflict-row" : ""}
                >
                  <td>
                    {isConflict ? (
                      <span
                        className="conflict-tooltip"
                        title="该学生已关联本课程的其他班次"
                      >
                        ⚠️
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isConflict && handleCheck(student)}
                        disabled={isConflict}
                      />
                    )}
                  </td>
                  <td>{student.stu_no}</td>
                  <td>{student.stu_name}</td>
                  <td>{student.gender === "M" ? "男" : "女"}</td>
                  <td>
                    {isSubmitting && isSelected
                      ? "保存中..."
                      : isLinked
                      ? "✓ 已关联"
                      : isConflict
                      ? "冲突（不可选）"
                      : "未关联"}
                  </td>
                </tr>
              );
            })}
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
