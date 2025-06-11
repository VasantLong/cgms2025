import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ClassDetail({ classinfo }) {
  const formRef = useRef();
  const navigate = useNavigate();
  console.log(`classinfo: ${JSON.stringify(classinfo)}`);
  const [isDirty, setDirty] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [courses, setCourses] = useState([]);

  // 获取课程列表
  useEffect(() => {
    if (!formRef.current) return;
    if (!classinfo) return;

    fetch("/api/course/list", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCourses(data));

    const elements = formRef.current.elements;
    elements.class_no.value = classinfo.class_no ?? "";
    elements.name.value = classinfo.name ?? "";
    elements.semester.value = classinfo.semester ?? null;
    elements.location.value = classinfo.location ?? null;
    elements.course_sn.value = classinfo.course_sn ?? null;

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
      "course_sn",
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
    if (!formRef.current) return;

    const elements = formRef.current.elements;
    const data = {
      class_sn: classinfo.class_sn || null,
      class_no: elements.class_no.value,
      name: elements.name.value,
      semester: elements.semester.value,
      location: elements.location.value,
      course_sn: Number(elements.course_sn.value),
    };

    try {
      setBusy(true);

      let url = data.class_sn ? `/api/class/${data.class_sn}` : "/api/class";
      let method = data.class_sn ? "PUT" : "POST";

      let response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
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
            <label>班次号：</label>
            <input
              type="text"
              name="class_no"
              onChange={(e) => {
                checkChange(e);
                if (!e.target.value.match(/^\d{5}-\d{4}$/))
                  setActionError("detail：班次必须为5位课程号-4位数字");
                else setActionError(null);
              }}
            />
          </div>
          <div className="field">
            <label>班次名称：</label>
            <input name="name" />
          </div>
          <div className="field">
            <label>学期：</label>
            <input
              type="text"
              name="semester"
              onChange={(e) => {
                checkChange(e);
                if (!e.target.value.match(/^\d{4}-\d{4}-[12]$/))
                  setActionError("detail：学期必须为年度-学期，如 2023-2024-1");
                else setActionError(null);
              }}
            />
          </div>
          <div className="field">
            <label>地点：</label>
            <input type="text" name="location" onChange={checkChange} />
          </div>
          <div className="field">
            <label>关联课程：</label>
            <select name="course_sn">
              {courses.map((course) => (
                <option key={course.course_sn} value={course.course_sn}>
                  {course.course_name} ({course.course_no})
                </option>
              ))}
            </select>
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
              navigate("/course/list");
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
