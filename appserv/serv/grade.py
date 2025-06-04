from .config import app, dblock

@app.get("/api/grade/list")
async def get_grade_list():
    with dblock() as db:
        db.execute("""
        SELECT g.stu_sn, g.cou_sn, 
            s.name as stu_name, 
            c.name as cou_name, 
            g.grade 
        FROM course_grade as g
            INNER JOIN student as s ON g.stu_sn = s.sn
            INNER JOIN course as c  ON g.cou_sn = c.sn
        ORDER BY stu_sn, cou_sn;        
        """)
        data = list(db)

    return data
