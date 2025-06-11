import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function CourseDetail({ courseinfo }) {
  const formRef = useRef(null);
  let navigate = useNavigate();
  console.log(`courseinfo: ${JSON.stringify(courseinfo)}`);
  const [isDirty, setDirty] = useState(false);
  const [isBusy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  // 空表单或获取课程信息后，给表单设置初始值
  useEffect(() => {
    if (!formRef.current) return;
    if (!courseinfo) return;

    const elements = formRef.current.elements;

    elements.course_no.value = courseinfo.course_no ?? "";
    elements.course_name.value = courseinfo.course_name ?? "";
    elements.credit.value = courseinfo.credit ?? null;
    elements.hours.value = courseinfo.hours ?? null;

    setDirty(false);
  }, [courseinfo]);

  const checkChange = (e) => {
    if (!formRef.current) return;

    if (courseinfo.course_sn === null) {
      if (!isDirty) setDirty(true);
      return;
    }

    for (let fieldName of ["course_no", "course_name", "credit", "hours"]) {
      if (courseinfo[fieldName] !== formRef.current.elements[fieldName].value) {
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
      course_sn: courseinfo.course_sn,
      course_no: elements.course_no.value,
      course_name: elements.course_name.value,
      credit: Number(elements.credit.value),
      hours: Number(elements.hours.value),
    };

    let url, http_method;
    if (data.course_sn === null) {
      // 新建课程记录
      url = `/api/course`;
      http_method = "POST";
    } else {
      // 更新课程记录信息
      url = `/api/course/${courseinfo.course_sn}`;
      http_method = "PUT";
    }

    try {
      setBusy(true);

      // 向服务器发送请求
      let response = await fetch(url, {
        method: http_method,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(data), // 将data对象序列化为JSON的字符串
      });

      console.log("coursedetial", response);

      if (!response.ok) {
        // TODO: 较草率处理错误
        console.error(response);
        const error = await response.json();
        setActionError(error.message);
        return;
      }

      const course = await response.json();

      if (courseinfo.course_sn === null) {
        navigate(`/course/${course.course_sn}/edit`);
        return;
      }
    } finally {
      setBusy(false);
    }
  };

  const deleteAction = async () => {
    let response = await fetch(`/api/course/${courseinfo.course_sn}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error(response);
      return;
    }

    navigate("/course/list");
  };

  return (
    <>
      <div className="paper-body">
        <form ref={formRef}>
          <div className="field">
            <label>课程编号: </label>
            <input
              type="text"
              name="course_no"
              onChange={(e) => {
                checkChange(e);
                if (!e.target.value.match(/^\d{5}$/))
                  setActionError("detail：课程号必须为5位数字");
                else setActionError(null);
              }}
            />
          </div>
          <div className="field">
            <label>课程名称: </label>
            <input type="text" name="course_name" onChange={checkChange} />
          </div>
          <div className="field">
            <label>学分: </label>
            <input
              type="number"
              name="credit"
              onChange={(e) => {
                checkChange(e);
                if (Number(e.target.value) <= 0)
                  setActionError("detail：学分必须大于0");
                else setActionError(null);
              }}
            />
          </div>
          <div className="field">
            <label>学时: </label>
            <input
              type="number"
              name="hours"
              onChange={(e) => {
                checkChange(e);
                if (Number(e.target.value) <= 0)
                  setActionError("detail：学时必须大于0");
                else setActionError(null);
              }}
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

export default CourseDetail;
