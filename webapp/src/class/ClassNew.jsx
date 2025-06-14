import ClassDetail from "./ClassDetail";

function ClassNew(props) {
  let classinfo = {
    class_sn: null,
  };

  return (
    <div className="paper">
      <ClassDetail classinfo={classinfo} />
    </div>
  );
}

export default ClassNew;
