import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetcher } from "../utils";
import ClassStudentSelection from "./ClassStudentSelection";
import "./class.css";

function ClassDetail({ classinfo }) {
  const formRef = useRef();
  let navigate = useNavigate();

  const isNew = classinfo.class_sn === null; //区分新增和编辑
  const [isDirty, setDirty] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCouSn, setSelectedCouSn] = useState(null);
  const [year, setYear] = useState("");
  const [semesterType, setSemesterType] = useState("");
  const [generatedValues, setGeneratedValues] = useState({
    class_no: "",
    semester: "",
    name: "",
  });
  // 新增状态管理选课标签页
  const [activeTab, setActiveTab] = useState("basic");

  // 在useEffect中添加调试输出
  useEffect(() => {
    console.log("当前表单值:", {
      selectedCouSn,
      location: formRef.current?.elements.location.value,
      classinfo,
    });
  }, [selectedCouSn, classinfo]);

  // 自动生成班次号、学期和名称的函数
  const generateClassInfo = async () => {
    if (!isNew) return; // 编辑模式下不自动生成
    if (!selectedCouSn || !year || !semesterType) return;

    //表单传入的元素属性使用前端的名称，而fieldName使用后端classinfo的名称
    const course = courses.find((c) => c.course_sn == selectedCouSn);
    if (!course) return;

    try {
      const response = await fetch(
        `/api/class/sequence?cou_sn=${selectedCouSn}&year=${year}&semesterType=${semesterType}`
      );
      const data = await response.json();

      // 自动生成班次号：课程号-当前年份-学期类型-序号（使用课程对象的 course_no）
      const nextSeq = (data.max_sequence || 0) + (isNew ? 1 : 0); // 编辑时不增加序号
      const classNo = `${course.course_no}-${year}S${semesterType}-${nextSeq
        .toString()
        .padStart(2, "0")}`;

      // 自动生成学期：年份区间+学期类型（使用本地状态 year 和 semesterType）
      const semester = `${year}-${Number(year) + 1}-${semesterType}`;

      // 自动生成班次名称：课程名 + 序号
      const className = `${course.course_name}_${nextSeq
        .toString()
        .padStart(2, "0")}`;

      setGeneratedValues({
        class_no: classNo,
        semester: semester,
        name: className,
      });
      setDirty(true);
    } catch (error) {
      console.error("生成班次信息失败:", error);
    }
  };

  // 当课程、年份或学期类型变化时，重新生成信息
  useEffect(() => {
    if (isNew) {
      generateClassInfo();
    }
  }, [courses, year, semesterType, selectedCouSn]);

  // 获取课程列表，设置表单初始值
  useEffect(() => {
    if (!classinfo) return;

    // 检查是否有保存的状态值（来自导航）
    if (location.state?.preservedValues) {
      setGeneratedValues(location.state.preservedValues);
      setSelectedCouSn(
        location.state.preservedValues.cou_sn || classinfo.cou_sn
      );
      setYear(location.state.preservedValues.semester?.split("-")[0] || "");
      setSemesterType(
        location.state.preservedValues.semester?.split("-")[2] || ""
      );
      setDirty(false);
      return;
    }

    fetch("/api/course/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setCourses(data);
        // 确保在数据加载后设置初始值
        if (!isNew) {
          setSelectedCouSn(classinfo.cou_sn);
        }
      })
      .catch((error) => {
        console.error("加载课程失败:", error);
        // 添加网络错误处理
        if (error.message.includes("Failed to fetch")) {
          setActionError("网络连接异常，请检查网络后重试");
        } else if (error.message.includes("401")) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setActionError(`加载课程失败: ${error.message}`);
        }
        setCourses([]); // 确保设置为空数组
      });

    // 编辑模式下设置初始值
    if (!isNew) {
      // 编辑现有班次
      setSelectedCouSn(classinfo.cou_sn);
      setYear(classinfo.semester?.split("-")[0] || "");
      setSemesterType(classinfo.semester?.split("-")[2] || "");
      setGeneratedValues({
        class_no: classinfo.class_no || "",
        semester: classinfo.semester || "",
        name: classinfo.name || "",
      });
      // 设置地点初始值
      if (formRef.current && classinfo.location) {
        formRef.current.elements.location.value = classinfo.location;
      }
    }
    setDirty(false);
  }, [classinfo, isNew, location.state]); // 添加location.state依赖

  // 表单值变化时检查是否有变化
  const checkChange = (e) => {
    if (!formRef.current) return;

    if (classinfo.class_sn === null) {
      if (!isDirty) setDirty(true);
      return;
    }

    const currentValues = {
      class_no: generatedValues.class_no,
      name: formRef.current.elements.name.value,
      semester: generatedValues.semester,
      location: formRef.current.elements.location.value,
      cou_sn: selectedCouSn,
    };

    const originalValues = {
      class_no: classinfo.class_no || "",
      name: classinfo.name || "",
      semester: classinfo.semester || "",
      location: classinfo.location || "",
      cou_sn: classinfo.cou_sn || null,
    };

    const hasChanged = Object.keys(currentValues).some(
      (key) => currentValues[key] !== originalValues[key]
    );

    setDirty(hasChanged);
  };
  // 表单提交处理
  const saveAction = async () => {
    if (!localStorage.getItem("token")) {
      setActionError("请先登录");
      navigate("/login");
      return;
    }
    if (!isNew) {
      // 编辑模式下的额外校验
      const original = {
        name: classinfo.name,
        cou_sn: classinfo.cou_sn,
        semester: classinfo.semester,
        class_no: classinfo.class_no,
      };

      const current = {
        name: generatedValues.name,
        cou_sn: Number(selectedCouSn),
        semester: generatedValues.semester,
        class_no: generatedValues.class_no,
      };

      if (JSON.stringify(original) !== JSON.stringify(current)) {
        setActionError("仅允许修改地点字段");
        return;
      }
    }
    if (!formRef.current) return;
    if (!formRef.current?.elements.cou_sn.value) {
      setActionError("请选择关联课程");
      return;
    }
    if (year === "" || semesterType === "") {
      setActionError("请先选择学年和学期类型");
      return;
    }

    const elements = formRef.current.elements;
    const data = {
      class_sn: classinfo.class_sn,
      class_no: generatedValues.class_no, // 使用状态值而不是直接取DOM
      name: elements.name.value,
      semester: generatedValues.semester, // 使用状态值
      location: elements.location.value,
      cou_sn: Number(elements.cou_sn.value),
    };

    try {
      setBusy(true);
      setActionError(null);

      let url = data.class_sn ? `/api/class/${data.class_sn}` : "/api/class";
      let method = data.class_sn ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      console.log("classdetial", response);

      if (!response.ok) {
        // TODO:
        const error = await response.json();
        console.error("API Error:", error);
        throw new Error(error.detail || "更新班次信息失败");
      }

      const class_data = await response.json();

      // 修改导航逻辑 - 传递状态避免重新生成
      navigate(`/class/${class_data.class_sn}`, {
        state: {
          preservedValues: {
            class_no: data.class_no,
            semester: data.semester,
            name: data.name,
            // 保留其他必要字段
            cou_sn: data.cou_sn,
            location: data.location,
          },
          // 标记这是从创建流程过来的
          fromCreate: true,
        },
        replace: true, // 使用replace而不是push，避免历史记录问题
      });
    } catch (error) {
      setActionError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAction = async () => {
    let response = await fetch(`/api/class/${classinfo.class_sn}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`, // 添加认证头
      },
    });

    if (!response.ok) {
      console.error(response);
      return;
    }

    navigate("/class/list");
  };

  return (
    <>
      {/* 头部显示班次信息 */}
      <div className="paper-head">
        <h2>{isNew ? "新建班次" : `班次详情：${classinfo.name}`}</h2>
      </div>

      {/* 新增选项卡导航 */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          基本信息
        </button>
        {!isNew && (
          <button
            className={`tab ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            学生管理
          </button>
        )}
      </div>

      {/* 选项卡内容 */}
      {activeTab === "basic" ? (
        <>
          <div className="paper-body">
            <form ref={formRef} onChange={checkChange}>
              <div className="field">
                <label>关联课程：</label>
                <select
                  name="cou_sn"
                  value={selectedCouSn || ""} // 添加value属性
                  onChange={(e) => {
                    setSelectedCouSn(e.target.value); // 更新选择的课程SN
                    setDirty(true);
                  }}
                >
                  <option value="">请选择课程</option>
                  {courses.map((course) => (
                    <option key={course.course_sn} value={course.course_sn}>
                      {course.course_name} ({course.course_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>起始学年：</label>
                <select
                  value={year}
                  name="year"
                  onChange={(e) => {
                    setYear(e.target.value);
                    setDirty(true);
                  }}
                >
                  <option value="">请选择学年</option>
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - 2 + i
                  ).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>学期类型：</label>
                <select
                  value={semesterType}
                  name="semesterType"
                  onChange={(e) => {
                    setSemesterType(e.target.value);
                    setDirty(true);
                  }}
                >
                  <option value="">请选择学期</option>
                  <option value="1">秋季学期</option>
                  <option value="2">春季学期</option>
                </select>
              </div>

              <div className="field">
                <label>班次名称：</label>
                <div className="generated-value">
                  <span>{generatedValues.name}</span>
                  <input
                    type="hidden"
                    name="name"
                    value={generatedValues.name}
                  />
                </div>
              </div>

              <div className="field">
                <label>班次号：</label>
                <div className="generated-value">
                  <span>{generatedValues.class_no}</span>
                  <input
                    type="hidden"
                    name="class_no"
                    value={generatedValues.class_no}
                  />
                </div>
              </div>

              <div className="field">
                <label>学期：</label>
                <div className="generated-value">
                  <span>{generatedValues.semester}</span>
                  <input
                    type="hidden"
                    name="semester"
                    value={generatedValues.semester}
                  />
                </div>
              </div>

              <div className="field">
                <label>地点：</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={classinfo?.location || ""}
                  onChange={checkChange}
                />
              </div>
            </form>
          </div>

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
                  navigate("/class/list");
                }}
              >
                返回
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="paper-body">
          <ClassStudentSelection classinfo={classinfo} />
        </div>
      )}

      <div className="statusbar">
        {isBusy && <div className="message">处理中，请稍后...</div>}
        {actionError && (
          <div className="message error">
            <span>发生错误：{actionError}</span>
            <button onClick={() => setActionError(null)}>X</button>
          </div>
        )}
      </div>
    </>
  );
}

export default ClassDetail;
