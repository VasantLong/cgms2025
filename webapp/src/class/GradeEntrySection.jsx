import { Table, InputNumber, Button, message, Modal, Alert } from "antd";
import { useState, useEffect } from "react";
import { fetcher } from "../utils";
import "./grade-entry.css";
import * as XLSX from "xlsx";

export default function GradeInputSection({ classinfo }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 新增状态和函数
  const [importData, setImportData] = useState([]);
  const [importVisible, setImportVisible] = useState(false);
  const [importStats, setImportStats] = useState(null);

  // 加载班次学生数据及已有成绩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetcher(
          `/api/class/${classinfo.class_sn}/students-with-grades`
        );
        setStudents(
          data.map((s) => ({
            ...s,
            key: s.stu_sn,
            // 确保grade是数字或null
            grade: typeof s.grade === "number" ? s.grade : null,
          }))
        );
      } catch (error) {
        console.error("加载学生成绩失败:", error);
        message.error(`加载失败: ${error.info?.detail || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (classinfo?.class_sn) {
      loadData();
    }
  }, [classinfo.class_sn]);

  // 处理成绩变更
  const handleGradeChange = (stu_sn, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.stu_sn === stu_sn ? { ...s, grade: value } : s))
    );
  };

  // 批量保存成绩
  const handleSave = async () => {
    try {
      setSaving(true);
      const grades = students
        .filter((s) => s.grade !== null && s.grade !== undefined)
        .map((s) => ({
          stu_sn: s.stu_sn,
          class_sn: classinfo.class_sn,
          grade: s.grade,
        }));

      if (grades.length === 0) {
        message.warning("没有可保存的成绩数据");
        return;
      }

      const result = await fetcher("/api/grade/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ grades }),
      });

      message.success(`成功保存 ${result.updated} 条成绩记录`);
    } catch (error) {
      console.error("保存成绩失败:", error);
      message.error(`保存失败: ${error.info?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Excel模块
  // 下载模板（增强版）
  const handleDownloadTemplate = async () => {
    try {
      // 使用 window.open 直接打开下载链接
      window.open(
        `/api/grade/template/${classinfo.class_sn}?token=${localStorage.getItem(
          "token"
        )}`,
        "_blank"
      );
    } catch (error) {
      message.error(`模板下载失败: ${error.message}`);
    }
  };

  // 解析Excel文件
  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          // 转换字段名为英文
          const mappedData = jsonData.map((item, index) => {
            // 新增成绩验证
            const gradeValue = item["成绩"];
            const isValidGrade =
              typeof gradeValue === "number" &&
              gradeValue >= 0 &&
              gradeValue <= 100;

            return {
              stu_no: item["学号"],
              name: item["姓名"],
              grade: isValidGrade ? gradeValue : null,
              remark: item["备注"] || "",
              // 新增错误标记
              _error: isValidGrade
                ? null
                : `第 ${index + 2} 行成绩无效（${gradeValue}）`,
            };
          });

          // 验证必要字段
          if (
            !mappedData.every(
              (item) => "stu_no" in item && "name" in item && "grade" in item
            )
          ) {
            throw new Error("Excel缺少必要列(学号/姓名/成绩)");
          }

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // 修改文件上传处理，获取文件名
  const handleFileUpload = async (e) => {
    if (e.target.files[0]) {
      try {
        const file = e.target.files[0];

        // 新验证逻辑：匹配班次编号和模板名称
        const expectedPattern = new RegExp(
          `${classinfo.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\(${
            classinfo.class_no
          }\\)成绩导入模板.*\\.xlsx`,
          "i" // 忽略大小写
        );

        if (!expectedPattern.test(file.name)) {
          message.error(
            `请使用模板文件: ${classinfo.name}(${classinfo.class_no})成绩导入模板.xlsx`
          );
          e.target.value = "";
          return;
        }

        // 通过验证后再解析文件
        const data = await parseExcel(file);
        setImportData({
          data,
          fileName: file.name, // 新增文件名存储
        });
        setImportVisible(true);
      } catch (error) {
        message.error(`文件解析错误: ${error.message}`);
      }
      e.target.value = "";
    }
  };

  // 导入确认
  const handleImportConfirm = async () => {
    try {
      const result = await fetcher("/api/grade/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_sn: classinfo.class_sn,
          records: importData.data.map((item) => ({
            stu_no: item.stu_no, // 保持英文字段名
            name: item.name,
            grade: item.grade,
            remark: item.remark || "",
          })),
        }),
      });

      setImportStats(result.stats); // 先更新统计信息

      if (result.stats.failed === 0) {
        message.success(`成功导入 ${result.stats.success} 条记录`);
        setStudents((prev) =>
          prev.map((s) => {
            const imported = importData.data.find((i) => i.stu_no === s.stu_no);
            return imported ? { ...s, grade: imported.grade } : s;
          })
        );
        handleCloseImportModal(); // 成功时关闭弹窗
      } else {
        message.warning(
          `导入完成，成功 ${result.stats.success} 条，失败 ${result.stats.failed} 条`
        );
      }
    } catch (error) {
      message.error(`导入失败: ${error.info?.detail || error.message}`);
      handleCloseImportModal();
    }
  };

  const columns = [
    {
      title: "学号",
      dataIndex: "stu_no",
      key: "stu_no",
      width: 120,
      fixed: "left",
      render: (text) => (
        <span style={{ color: "hsl(306, 40%, 25%)" }}>{text}</span>
      ),
    },
    {
      title: "姓名",
      dataIndex: "stu_name",
      key: "stu_name",
      width: 100,
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "成绩",
      dataIndex: "grade",
      key: "grade",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.grade}
          onChange={(value) => handleGradeChange(record.stu_sn, value)}
          precision={1}
          style={{ width: "100%" }}
          placeholder="输入0-100"
        />
      ),
    },
  ];

  // 新增弹窗关闭处理函数
  const handleCloseImportModal = () => {
    setImportVisible(false);
    setImportStats(null); // 重置统计信息
    setImportData({ data: [], fileName: "" }); // 清空导入数据
  };

  return (
    <div className="grade-entry-container">
      <div className="grade-toolbar">
        <div>
          <Button onClick={handleDownloadTemplate}>下载模板</Button>
          <Button
            type="primary"
            onClick={() => document.getElementById("excel-upload").click()}
          >
            导入Excel
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={loading || students.length === 0}
          >
            {saving ? "保存中..." : "批量保存成绩"}
          </Button>
        </div>
        <div className="grade-count">
          <span>班次: {classinfo.class_no} | </span>
          <span>学生总数: {students.length} | </span>
          <span>已录入: {students.filter((s) => s.grade !== null).length}</span>
        </div>
      </div>

      {/* 隐藏的文件上传input */}
      <input
        type="file"
        id="excel-upload"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* 导入确认对话框 */}
      <Modal
        title="导入确认"
        open={importVisible}
        onOk={async () => {
          await handleImportConfirm(); // 等待导入操作完成
        }}
        onCancel={handleCloseImportModal}
        okText="确认导入"
        cancelText="取消"
        width={800}
      >
        <div className="import-preview">
          <Table
            columns={[
              { title: "学号", dataIndex: "stu_no", key: "stu_no" },
              { title: "姓名", dataIndex: "name", key: "name" },
              {
                title: "成绩",
                dataIndex: "grade",
                key: "grade",
                render: (value, record) => (
                  <span
                    style={{
                      color: record._error
                        ? "red"
                        : value < 0 || value > 100
                        ? "orange"
                        : "green",
                    }}
                  >
                    {record._error || (value ?? "空值")}
                  </span>
                ),
              },
              { title: "备注", dataIndex: "remark", key: "remark" },
            ]}
            dataSource={importData.data}
            pagination={{ pageSize: 5 }}
            rowKey="stu_no"
          />
          {importStats && (
            <div className="import-stats">
              <Alert
                message={`验证结果: 成功 ${importStats.success} 条，失败 ${importStats.failed} 条，无效 ${importStats.invalid} 条`}
                type={importStats.failed === 0 ? "success" : "warning"}
              />
            </div>
          )}
        </div>
      </Modal>

      <Table
        columns={columns}
        dataSource={students}
        loading={loading}
        pagination={false}
        rowKey="stu_sn"
        scroll={{ x: true }}
        className="grade-table"
        locale={{
          emptyText: loading ? "加载学生数据中..." : "暂无学生数据",
        }}
      />
    </div>
  );
}
