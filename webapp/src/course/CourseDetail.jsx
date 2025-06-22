import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetcher } from "../utils";
import { FormField } from "../components/StyledForm";
import {
  Paper,
  PaperHead,
  PaperBody,
  PaperFooter,
  StatusBar,
  Message,
  ErrorMessage,
  ErrorButton,
} from "../components/StyledPaper";
import StyledButton from "../components/StyledButton";
import { message, Modal } from "antd";

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
    // 检查输入验证逻辑
    if (e.target.name === "course_no" && !e.target.value.match(/^\d{5}$/)) {
      setActionError("detail：课程号必须为 5 位数字");
    } else if (e.target.name === "credit" && Number(e.target.value) <= 0) {
      setActionError("detail：学分必须大于 0");
    } else {
      setActionError(null);
    }
  };

  const saveAction = async () => {
    if (!formRef.current) return;

    const elements = formRef.current.elements;
    let data = {
      course_no: elements.course_no.value,
      course_name: elements.course_name.value,
      credit: Number(elements.credit.value),
      hours: Number(elements.hours.value),
    };

    let url, http_method;
    if (courseinfo.course_sn === null) {
      // 新建课程记录
      url = `/api/course`;
      http_method = "POST";
    } else {
      // 更新课程记录信息
      data.course_sn = courseinfo.course_sn;
      url = `/api/course/${courseinfo.course_sn}`;
      http_method = "PUT";
    }

    try {
      setBusy(true);

      // 向服务器发送请求
      const response = await fetcher(url, {
        method: http_method,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
        body: JSON.stringify(data),
      });

      if (courseinfo.course_sn === null) {
        navigate(`/course/${response.course_sn}`);
        return;
      }
    } catch (error) {
      setActionError(error.info?.detail || error.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAction = async () => {
    try {
      setBusy(true); // 开始删除操作，设置为忙

      // 检查课程是否有相关引用（如被班次引用）
      const { has_references } = await fetcher(
        `/api/course/${courseinfo.course_sn}/has-references`
      );
      if (has_references) {
        message.error("该课程有相关引用，不能删除");
        return;
      } else {
        // 发送删除请求前给出确认提示
        const confirmResult = await new Promise((resolve) => {
          Modal.confirm({
            title: "警告",
            content: "该操作不可逆，请谨慎确认，是否继续删除？",
            okText: "确认删除",
            cancelText: "取消",
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });

        if (!confirmResult) {
          return;
        }
        // 使用 fetcher 函数发送删除请求
        await fetcher(`/api/course/${courseinfo.course_sn}`, {
          method: "DELETE",
        });
        message.success("课程删除成功");
        navigate("/course/list");
      }
    } catch (error) {
      message.error(error.info?.detail || error.message);
      setActionError(error.info?.detail || error.message);
    } finally {
      setBusy(false); // 动作结束，设置为非忙
    }
  };

  return (
    <>
      <PaperHead>
        <div className="head-actions">
          <StyledButton onClick={() => navigate("/course/list")}>
            返回列表
          </StyledButton>
        </div>
      </PaperHead>
      <PaperBody>
        <form ref={formRef}>
          <FormField>
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
          </FormField>
          <FormField>
            <label>课程名称: </label>
            <input type="text" name="course_name" onChange={checkChange} />
          </FormField>
          <FormField>
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
          </FormField>
          <FormField>
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
          </FormField>
        </form>
      </PaperBody>
      <PaperFooter>
        <div className="btns">
          <StyledButton onClick={deleteAction} disabled={isBusy}>
            删除
          </StyledButton>
          <StyledButton onClick={saveAction} disabled={isBusy || !!actionError}>
            保存
          </StyledButton>
        </div>
      </PaperFooter>
      <StatusBar>
        {isBusy && <Message>处理中，请稍后...</Message>}
        {actionError && (
          <ErrorMessage>
            <span>发生错误：{actionError}</span>
            <ErrorButton onClick={() => setActionError(null)}>X</ErrorButton>
          </ErrorMessage>
        )}
      </StatusBar>
    </>
  );
}

export default CourseDetail;
