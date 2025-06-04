import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function StudentDetail(props) {
    const { stuinfo } = props;
    const formRef = useRef(null);
    let navigate = useNavigate();

    const [isDirty, setDirty] = useState(false);
    const [isBusy, setBusy] = useState(false);
    const [actionError, setActionError] = useState(null);

    //　空表单或获取学生信息后，给表单设置初始值
    useEffect(() => {
        if (!formRef.current) return;

        if (!stuinfo) return;

        const elements = formRef.current.elements;

        elements.stu_no.value = stuinfo.stu_no ?? "";
        elements.stu_name.value = stuinfo.stu_name ?? "";
        elements.gender.value = stuinfo.gender ??  null;
        elements.enrolled.value = stuinfo.enrolled ?? null;

        setDirty(false);
    }, [stuinfo]);

    const checkChange = (e) => {
        if (!formRef.current) return;

        if (stuinfo.stu_sn === null) {
            if (!isDirty) setDirty(true);
            return;
        }

        for (let fieldName of ["stu_no", "stu_name", "gender", "enrolled"]) {
            if (
                stuinfo[fieldName] !== formRef.current.elements[fieldName].value
            ) {
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
            enrolled: elements.enrolled.value,
        };

        let url, http_method;
        if (data.stu_sn === null) {
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

            console.log(1111, response);

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


    return (
        // 标签<> </>在JSX表示嵌套是一段JSX元素的片段
        <>
            <div className="paper-body">
                <form ref={formRef}>
                    <div className="field">
                        <label>学号: </label>
                        <input
                            type="text"
                            name="stu_no"
                            onChange={checkChange}
                        />
                    </div>
                    <div className="field">
                        <label>姓名: </label>
                        <input
                            type="text"
                            name="stu_name"
                            onChange={checkChange}
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
                                />
                            </span>
                            <span className="option">
                                女
                                <input
                                    type="radio"
                                    name="gender"
                                    value="F"
                                    onChange={checkChange}
                                />
                            </span>
                        </div>
                    </div>
                    <div className="field">
                        <label>入学时间: </label>
                        <input
                            type="date"
                            name="enrolled"
                            onChange={checkChange}
                        />
                    </div>
                </form>
            </div>
            <div className="paper-footer">
                <div className="btns">
                    <button
                        className="btn"
                        onClick={deleteAction}
                        disabled={isBusy}
                    >
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

export default StudentDetail;
