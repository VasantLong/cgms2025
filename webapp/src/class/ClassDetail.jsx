import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./class.css";

function ClassDetail({ classinfo }) {
  const formRef = useRef();
  let navigate = useNavigate();

  const [isDirty, setDirty] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCouSn, setSelectedCouSn] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [semesterType, setSemesterType] = useState("");

  // 生成班次号和学期
  useEffect(() => {
    if (!formRef.current) return;
    if (!courses) return;
    if (!selectedCouSn) return;

    let course = courses.find(
      //表单传入的元素属性使用前端的名称，而fieldName使用后端classinfo的名称
      (c) => c.course_sn == selectedCouSn
    );
    if (course && year && semesterType) {
      fetch(
        `/api/class/sequence?cou_sn=${selectedCouSn}&year=${year}&semesterType=${semesterType}`
      )
        .then((res) => res.json())
        .then((data) => {
          // 自动生成班次号：课程号-当前年份-学期类型-序号（使用课程对象的 course_no）
          let nextSeq = (data.max_sequence || 0) + 1;
          let classNo = `${course.course_no}-${year}S${semesterType}-${nextSeq
            .toString()
            .padStart(2, "0")}`;
          formRef.current.elements.class_no.value = classNo;
          // 自动生成学期：年份区间+学期类型（使用本地状态 year 和 semesterType）
          formRef.current.elements.semester.value = `${year}-${
            Number(year) + 1
          }-${semesterType}`;

          // 当名称为空或匹配自动生成模式时，自动生成班次名称：课程名 + 序号
          let className = `${course.course_name}_${nextSeq
            .toString()
            .padStart(2, "0")}`;
          if (
            !formRef.current.elements.name.value ||
            formRef.current.elements.name.value.startsWith(course.course_name)
          ) {
            formRef.current.elements.name.value = className;
          }
        });
    }
  }, [courses, year, semesterType, selectedCouSn]);

  // 获取课程列表，设置表单初始值
  useEffect(() => {
    if (!formRef.current) return;
    if (!classinfo) return;

    fetch("/api/course/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCourses(data)); // 从后端获取课程列表数据

    const elements = formRef.current.elements;
    elements.class_no.value = classinfo.class_no ?? "";
    elements.name.value = classinfo.name ?? "";
    elements.semester.value = classinfo.semester ?? null;
    elements.location.value = classinfo.location ?? null;
    elements.cou_sn.value = classinfo.cou_sn ?? null;

    setDirty(false);
  }, [classinfo]);

  const checkChange = (e) => {
    if (!formRef.current) return;

    if (classinfo.class_sn === null) {
      if (!isDirty) setDirty(true);
      return;
    }

    for (let fieldName of [
      "class_no",
      "name",
      "semester",
      "location",
      "cou_sn",
    ]) {
      if (classinfo[fieldName] !== formRef.current.elements[fieldName].value) {
        if (!isDirty) setDirty(true);
        return;
      }
    }

    if (isDirty) {
      setDirty(false);
    }
  };
  // 表单提交处理
  const saveAction = async () => {
    if (!localStorage.getItem("token")) {
      setActionError("请先登录");
      navigate("/login");
      return;
    }
    if (!formRef.current) return;
    if (!formRef.current?.elements.cou_sn.value) {
      setActionError("请选择关联课程");
      return;
    }
    if (year === "" || semesterType === "0") {
      setActionError("请先选择学年和学期类型");
      return;
    }

    const elements = formRef.current.elements;
    const data = {
      class_sn: classinfo.class_sn,
      class_no: elements.class_no.value,
      name: elements.name.value,
      semester: elements.semester.value,
      location: elements.location.value,
      cou_sn: Number(elements.cou_sn.value),
    };
    // 添加空值校验
    if (!data.class_no || !data.semester || !data.cou_sn) {
      setActionError("所有带*字段为必填项");
      return;
    }
    try {
      setBusy(true);

      let url = data.class_sn ? `/api/class/${data.class_sn}` : "/api/class";
      let method = data.class_sn ? "PUT" : "POST";

      let response = await fetch(url, {
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
        console.error(response);
        const error = await response.json();
        throw new Error(error.detail);
      }

      const class_data = await response.json();
      if (classinfo.class_sn === null) {
        navigate(`/class/${class_data.class_sn}`);
        return;
      }
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
      <div className="paper-body">
        <form ref={formRef} onChange={() => setDirty(true)}>
          <div className="field">
            <label>关联课程：</label>
            <select
              name="cou_sn"
              onChange={(e) => {
                setDirty(true);
                setSelectedCouSn(e.target.value); // 更新选择的课程SN
              }}
            >
              <option value="">请选择课程</option>
              {/* courses来自后端Course */}
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
              onChange={(e) => setYear(e.target.value)}
              required
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
              onChange={(e) => setSemesterType(e.target.value)}
              required
            >
              <option value="">请选择学期</option>
              <option value="1">秋季学期</option>
              <option value="2">春季学期</option>
            </select>
          </div>

          <div className="field">
            <label>班次名称：</label>
            <div style={{ position: "relative" }}>
              <input
                name="name"
                onFocus={(e) => {
                  if (
                    e.target.value ===
                    `${
                      courses.find((c) => c.course_sn == selectedCouSn)
                        ?.course_name || ""
                    }01`
                  ) {
                    e.target.value = "";
                  }
                }}
              />
              {/* 提示文字 */}
              <div
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                  pointerEvents: "none",
                  display: formRef.current?.elements.name.value
                    ? "none"
                    : "block",
                }}
              >
                {selectedCouSn ? "" : "选择课程后将自动生成"}
              </div>
            </div>
          </div>

          <div className="field">
            <label>班次号：</label>
            <div className="generated-value">
              <span>{formRef.current?.elements.class_no.value}</span>
              <input type="hidden" name="class_no" />
            </div>
          </div>

          <div className="field">
            <label>学期：</label>
            <div className="generated-value">
              <span>{formRef.current?.elements.semester.value}</span>
              <input type="hidden" name="semester" />
            </div>
          </div>

          <div className="field">
            <label>地点：</label>
            <input type="text" name="location" onChange={checkChange} />
          </div>
        </form>
      </div>

      {/* 操作按钮 */}
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
