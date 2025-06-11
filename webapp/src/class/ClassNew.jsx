import ClassDetail from "./ClassDetail";

function ClassNew(props) {
  let classinfo = {
    class_sn: null,
  };

  return (
    <div className="paper">
      <div className="paper-head">
        <h3>新建班次</h3>
      </div>
      <ClassDetail classinfo={{}} />
    </div>
  );
}

export default ClassNew;
