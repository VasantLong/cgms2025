import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, Descriptions, Table, Statistic, Button, Card } from "antd";
import { fetcher } from "../utils";
import useSWR from "swr";
import "./student.css";

function StudentDetail({ stuinfo }) {
  const [activeTab, setActiveTab] = useState("basic");
  const formRef = useRef(null);
  let navigate = useNavigate();
  const isNew = stuinfo.stu_sn === null;
  const [isDirty, setDirty] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const { data } = useSWR(
    activeTab === "report" ? `/api/student/${stuinfo.stu_sn}/report` : null,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  //　空表单或获取学生信息后，给表单设置初始值
  useEffect(() => {
    if (!formRef.current) return;

    // 新增模式清空表单
    if (isNew) {
      formRef.current.reset();
      return;
    }

    const elements = formRef.current.elements;

    elements.stu_no.value = stuinfo.stu_no ?? "";
    elements.stu_name.value = stuinfo.stu_name ?? "";
    elements.gender.value = stuinfo.gender ?? null;
    elements.enrollment_date.value = stuinfo.enrollment_date ?? null;

    setDirty(false);
  }, [stuinfo, isNew]);

  const checkChange = (e) => {
    if (!formRef.current) return;

    if (stuinfo.stu_sn === null) {
      if (!isDirty) setDirty(true);
      return;
    }

    for (let fieldName of ["stu_no", "stu_name", "gender", "enrollment_date"]) {
      if (stuinfo[fieldName] !== formRef.current.elements[fieldName].value) {
        if (!isDirty) setDirty(true);
        return;
      }
    }

    if (isDirty) {
      setDirty(false);
    }
  };

  const saveAction = async () => {
    if (!formRef.current) return;

    const elements = formRef.current.elements;
    let data = {
      stu_sn: stuinfo.stu_sn,
      stu_no: elements.stu_no.value,
      stu_name: elements.stu_name.value,
      gender: elements.gender.value,
      enrollment_date: elements.enrollment_date.value,
    };

    // 编辑模式校验
    if (!isNew) {
      const original = {
        stu_no: stuinfo.stu_no,
        stu_name: stuinfo.stu_name,
        gender: stuinfo.gender,
        enrollment_date: stuinfo.enrollment_date,
      };

      if (JSON.stringify(original) !== JSON.stringify(data)) {
        setActionError("仅允许修改学生姓名和性别");
        return;
      }
    }
    // todo:和coursedetail的验证方式有所不同
    // 前端验证：学号必须为9位数字
    if (!/^\d{9}$/.test(data.stu_no)) {
      setActionError("学号必须为9位数字");
      return;
    }
    // 前端验证：入学日期必须在2000年1月1日之后
    if (
      data.enrollment_date &&
      new Date(data.enrollment_date) < new Date("2000-01-01")
    ) {
      setActionError("入学日期必须在2000年1月1日之后");
      return;
    }

    let url, http_method;
    if (isNew) {
      // 新建学生记录
      url = `/api/student`;
      http_method = "POST";
    } else {
      // 更新学生记录信息
      url = `/api/student/${stuinfo.stu_sn}`;
      http_method = "PUT";
    }

    try {
      setBusy(true); // 开始向服务提交请求，设置为忙

      // 向服务器发送请求
      let response = await fetch(url, {
        method: http_method,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(data), // 将data对象序列化为JSON的字符串
      });

      console.log("studetail", response);

      if (!response.ok) {
        // TODO: 较草率处理错误
        console.error(response);
        const error = await response.json();
        setActionError(error.message);
        return;
      }

      const student = await response.json();

      if (stuinfo.stu_sn === null) {
        // 创建新学生记录后，按照新分配的序号重新加载学生信息
        navigate(`/student/${student.stu_sn}`);
        return;
      }
    } finally {
      setBusy(false); // 动作结束，设置为非忙
    }
  };

  const deleteAction = async () => {
    let response = await fetch(`/api/student/${stuinfo.stu_sn}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error(response);
      return;
    }

    navigate("/student/list");
  };

  // 新增导出功能
  const handleExport = async (format) => {
    try {
      // 需要直接处理 blob 响应，因此使用fetch
      const response = await fetch(
        `/api/student/${stuinfo.stu_sn}/report/export?format=${format}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      if (!response.ok) {
        throw new Error(`导出失败：${response.statusText}`);
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? decodeURIComponent(contentDisposition.split("filename*=UTF-8''")[1])
        : `学生成绩_${stuinfo.stu_no}_${new Date()
            .toISOString()
            .slice(0, 10)}.${format}`;

      // 创建隐藏的下载链接
      const link = document.createElement("a");
      const url = window.URL.createObjectURL(await response.blob());
      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();

      // 清理资源
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(`导出失败：${error.message}`);
    }
  };

  return (
    // 标签<> </>在JSX表示嵌套是一段JSX元素的片段
    <>
      {/* 头部 */}
      <div className="paper-head">
        <h2>{isNew ? "新建学生档案" : `学生详情：${stuinfo.stu_name}`}</h2>
        <div className="head-actions">
          <Button onClick={() => navigate(-1)}>返回列表</Button>
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          基本信息
        </button>
        <button
          className={`tab ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          成绩档案
        </button>
      </div>

      {/* 标签页内容 */}
      {activeTab === "basic" && (
        <div className="paper-body">
          <form ref={formRef}>
            <div className="field">
              <label>学号: </label>
              <input
                type="text"
                name="stu_no"
                onChange={checkChange}
                disabled={!isNew} // 仅新增模式可编辑
              />
            </div>
            <div className="field">
              <label>姓名: </label>
              <input
                type="text"
                name="stu_name"
                onChange={checkChange}
                disabled={!isNew}
              />
            </div>
            <div className="field">
              <label>性别: </label>
              <div className="radio-choices">
                <span className="option">
                  男
                  <input
                    type="radio"
                    name="gender"
                    value="M"
                    onChange={checkChange}
                    disabled={!isNew}
                  />
                </span>
                <span className="option">
                  女
                  <input
                    type="radio"
                    name="gender"
                    value="F"
                    onChange={checkChange}
                    disabled={!isNew}
                  />
                </span>
              </div>
            </div>
            <div className="field">
              <label>入学时间: </label>
              <input
                type="date"
                name="enrollment_date"
                onChange={checkChange}
                disabled={!isNew} // 仅新增模式可编辑
              />
            </div>
          </form>
          <div className="paper-footer">
            <div className="btns">
              <button className="btn" onClick={deleteAction} disabled={isBusy}>
                删除
              </button>
              <button
                className="btn"
                onClick={saveAction}
                disabled={isBusy || !isDirty}
              >
                保存
              </button>
              <button
                className="btn"
                onClick={() => {
                  navigate("/student/list");
                }}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === "report" && (
        <div className="paper-body">
          <div className="full-tab-container">
            <div className="action-bar">
              <Button type="primary" onClick={() => handleExport("xlsx")}>
                导出Excel
              </Button>
              <Button type="primary" onClick={() => handleExport("pdf")}>
                导出PDF
              </Button>
              <span className="stats-summary">
                总学分：{data?.stats.total_credits || 0}| 平均成绩：
                {data?.stats.gpa?.toFixed(2) || "N/A"}
              </span>
            </div>

            {/* 带分页的表格 */}
            <Table
              dataSource={data?.grades || []}
              pagination={{ pageSize: 10 }}
              rowKey={(record) => `${record.class_sn}-${record.course_name}`}
              columns={[
                {
                  key: "course_name",
                  title: "课程名称",
                  dataIndex: "course_name",
                  fixed: "left",
                },
                {
                  key: "class_no",
                  title: "班次号",
                  dataIndex: "class_no",
                },
                {
                  key: "grade",
                  title: "成绩",
                  dataIndex: "grade",
                  render: (v) => v ?? <span className="muted">未录入</span>,
                },
                {
                  key: "credit",
                  title: "学分",
                  dataIndex: "credit",
                },
                {
                  key: "semester",
                  title: "学期",
                  dataIndex: "semester",
                },
              ]}
              scroll={{ x: 800 }}
            />
          </div>

          <div className="paper-footer">
            <div className="btns">
              <button
                className="btn"
                onClick={() => {
                  navigate("/student/list");
                }}
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="status-bar">
        {isBusy && <div className="processing-indicator">数据提交中...</div>}
        {actionError && (
          <div className="error-message">
            ❌ 操作失败：{actionError}
            <button className="close-btn" onClick={() => setActionError(null)}>
              ×
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default StudentDetail;
