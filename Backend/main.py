from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg
from datetime import date, datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)
def get_database_connection():
    return psycopg.connect(
        host="localhost",
        port=5432,
        dbname="LAN_Attendence",
        user="postgres",
        password="Pillai@123"
    )


# ==============================
# HOME
# ==============================

@app.get("/")
def home():
    return {
        "message": "LAN Attendance Backend is running"
    }


# ==============================
# STUDENTS
# ==============================

@app.get("/students")
def get_students():

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT roll_no, name, division
        FROM students
        ORDER BY roll_no
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [
        {
            "roll_no": row[0],
            "name": row[1],
            "division": row[2]
        }
        for row in rows
    ]


class Student(BaseModel):
    roll_no: str
    name: str
    division: str


@app.post("/students")
def add_student(student: Student):

    conn = get_database_connection()
    cur = conn.cursor()

    try:

        cur.execute("""
            INSERT INTO students
            (roll_no, name, division)
            VALUES (%s, %s, %s)
        """, (
            student.roll_no,
            student.name,
            student.division
        ))

        conn.commit()

        return {
            "message": "Student added successfully"
        }

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    finally:

        cur.close()
        conn.close()


# ==============================
# GET ALL SESSIONS
# ==============================

@app.get("/sessions")
def get_sessions():

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            session_id,
            subject,
            date,
            start_time,
            status
        FROM sessions
        ORDER BY date DESC, start_time DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [
        {
            "session_id": row[0],
            "subject": row[1],
            "date": str(row[2]),
            "start_time": str(row[3]),
            "status": row[4]
        }
        for row in rows
    ]


# ==============================
# GET ACTIVE SESSION
# ==============================

@app.get("/sessions/active")
def get_active_session():

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            session_id,
            subject,
            date,
            start_time,
            status
        FROM sessions
        WHERE status = 'ACTIVE'
        ORDER BY date DESC, start_time DESC
        LIMIT 1
    """)

    row = cur.fetchone()

    cur.close()
    conn.close()

    if row is None:
        return {
            "active": False
        }

    return {
        "active": True,
        "session_id": row[0],
        "subject": row[1],
        "date": str(row[2]),
        "start_time": str(row[3]),
        "status": row[4]
    }


# ==============================
# CREATE SESSION
# ==============================

class SessionCreate(BaseModel):
    subject: str


@app.post("/sessions")
def create_session(session: SessionCreate):

    conn = get_database_connection()
    cur = conn.cursor()

    session_id = "LAB" + datetime.now().strftime("%H%M%S")

    try:

        cur.execute("""
            INSERT INTO sessions
            (session_id, subject, date, start_time, status)
            VALUES (%s, %s, CURRENT_DATE, CURRENT_TIME, 'ACTIVE')
        """, (
            session_id,
            session.subject
        ))

        conn.commit()

        return {
            "message": "Session created successfully",
            "session_id": session_id
        }

    except Exception as e:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    finally:

        cur.close()
        conn.close()


# ==============================
# CLOSE SESSION
# ==============================

@app.put("/sessions/{session_id}/close")
def close_session(session_id: str):

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE sessions
        SET status = 'CLOSED'
        WHERE session_id = %s
    """, (session_id,))

    if cur.rowcount == 0:

        cur.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    conn.commit()

    cur.close()
    conn.close()

    return {
        "message": "Session closed successfully",
        "session_id": session_id
    }


# ==============================
# REOPEN SESSION
# ==============================

@app.put("/sessions/{session_id}/reopen")
def reopen_session(session_id: str):

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE sessions
        SET status = 'ACTIVE'
        WHERE session_id = %s
    """, (session_id,))

    if cur.rowcount == 0:

        cur.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    conn.commit()

    cur.close()
    conn.close()

    return {
        "message": "Session reopened successfully",
        "session_id": session_id
    }


# ==============================
# ATTENDANCE
# ==============================

class AttendanceCreate(BaseModel):
    roll_no: str
    session_id: str


@app.post("/attendance")
def mark_attendance(attendance: AttendanceCreate):

    conn = get_database_connection()
    cur = conn.cursor()

    # Check session

    cur.execute("""
        SELECT status
        FROM sessions
        WHERE session_id = %s
    """, (attendance.session_id,))

    session = cur.fetchone()

    if session is None:

        cur.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    if session[0] != "ACTIVE":

        cur.close()
        conn.close()

        raise HTTPException(
            status_code=400,
            detail="Session is not active"
        )


    # Check student

    cur.execute("""
        SELECT roll_no
        FROM students
        WHERE roll_no = %s
    """, (attendance.roll_no,))

    student = cur.fetchone()

    if student is None:

        cur.close()
        conn.close()

        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )


    # Insert attendance

    try:

        cur.execute("""
            INSERT INTO attendance
            (roll_no, session_id, date, time, status)
            VALUES
            (%s, %s, CURRENT_DATE, CURRENT_TIME, 'PRESENT')
        """, (
            attendance.roll_no,
            attendance.session_id
        ))

        conn.commit()

        return {
            "message": "Attendance marked successfully",
            "roll_no": attendance.roll_no,
            "session_id": attendance.session_id
        }

    except psycopg.errors.UniqueViolation:

        conn.rollback()

        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this session"
        )

    finally:

        cur.close()
        conn.close()


# ==============================
# GET ATTENDANCE
# ==============================

@app.get("/attendance")
def get_attendance():

    conn = get_database_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            a.roll_no,
            s.name,
            s.division,
            a.session_id,
            a.date,
            a.time,
            a.status
        FROM attendance a
        JOIN students s
        ON a.roll_no = s.roll_no
        ORDER BY a.date DESC, a.time DESC
    """)

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return [
        {
            "roll_no": row[0],
            "name": row[1],
            "division": row[2],
            "session_id": row[3],
            "date": str(row[4]),
            "time": str(row[5]),
            "status": row[6]
        }
        for row in rows
    ]