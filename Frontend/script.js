const API_URL = "http://127.0.0.1:8000";


// ==============================
// HOME PAGE
// ==============================

function openAdmin() {
    window.location.href = "admin.html";
}

function openStudent() {
    window.location.href = "student.html";
}


// ==============================
// ADMIN NAVIGATION
// ==============================

function showSection(sectionId) {

    const sections = [
        "students",
        "sessions",
        "attendance"
    ];

    sections.forEach(function(id) {

        const section = document.getElementById(id);

        if (section) {
            section.style.display =
                id === sectionId ? "block" : "none";
        }
    });

    if (sectionId === "students") {
        loadStudents();
    }

    if (sectionId === "sessions") {
        loadSessions();
    }

    if (sectionId === "attendance") {
        loadAttendance();
    }
}


// ==============================
// LOAD STUDENTS
// ==============================

async function loadStudents() {

    try {

        const response =
            await fetch(API_URL + "/students");

        const students =
            await response.json();

        const table =
            document.getElementById("studentTable");

        if (!table) return;

        table.innerHTML = "";

        students.forEach(function(student) {

            const row =
                table.insertRow();

            row.insertCell(0).textContent =
                student.roll_no;

            row.insertCell(1).textContent =
                student.name;

            row.insertCell(2).textContent =
                student.division;
        });

    } catch (error) {

        alert("Could not load students.");
        console.error(error);
    }
}


// ==============================
// ADD STUDENT
// ==============================

async function addStudent() {

    const rollNumber =
        document.getElementById("rollNumber").value.trim();

    const studentName =
        document.getElementById("studentName").value.trim();

    const division =
        document.getElementById("division").value.trim();


    if (
        rollNumber === "" ||
        studentName === "" ||
        division === ""
    ) {
        alert("Please fill all student details.");
        return;
    }


    try {

        const response =
            await fetch(API_URL + "/students", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    roll_no: rollNumber,
                    name: studentName,
                    division: division
                })
            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.detail || "Could not add student.");
            return;
        }


        alert("Student added successfully.");


        document.getElementById("rollNumber").value = "";
        document.getElementById("studentName").value = "";
        document.getElementById("division").value = "";


        loadStudents();

    } catch (error) {

        alert("Could not connect to the backend.");
        console.error(error);
    }
}


// ==============================
// LOAD SESSIONS
// ==============================

async function loadSessions() {

    try {

        const response =
            await fetch(API_URL + "/sessions");

        const sessions =
            await response.json();

        const table =
            document.getElementById("sessionTable");

        if (!table) return;

        table.innerHTML = "";


        sessions.forEach(function(session) {

            const row =
                table.insertRow();


            row.insertCell(0).textContent =
                session.session_id;

            row.insertCell(1).textContent =
                session.subject;

            row.insertCell(2).textContent =
                session.date;

            row.insertCell(3).textContent =
                session.start_time;


            const statusCell =
                row.insertCell(4);

            const status =
                document.createElement("span");

            status.className =
                session.status === "ACTIVE"
                    ? "status active"
                    : "status";

            status.textContent =
                session.status;

            if (session.status === "CLOSED") {

                status.style.background =
                    "#fee2e2";

                status.style.color =
                    "#991b1b";
            }

            statusCell.appendChild(status);


            const actionCell =
                row.insertCell(5);


            if (session.status === "ACTIVE") {

                const closeButton =
                    document.createElement("button");

                closeButton.className =
                    "small-button";

                closeButton.textContent =
                    "Close";

                closeButton.onclick =
                    function() {
                        closeSession(session.session_id);
                    };

                actionCell.appendChild(
                    closeButton
                );

            } else {

                const reopenButton =
                    document.createElement("button");

                reopenButton.className =
                    "small-button";

                reopenButton.style.background =
                    "#2563eb";

                reopenButton.textContent =
                    "Reopen";

                reopenButton.onclick =
                    function() {
                        reopenSession(session.session_id);
                    };

                actionCell.appendChild(
                    reopenButton
                );
            }
        });

    } catch (error) {

        alert("Could not load sessions.");
        console.error(error);
    }
}


// ==============================
// CREATE SESSION
// ==============================

async function createSession() {

    const subject =
        document.getElementById("subject").value.trim();


    if (subject === "") {

        alert("Please enter the subject.");
        return;
    }


    try {

        const response =
            await fetch(API_URL + "/sessions", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    subject: subject
                })
            });


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.detail || "Could not create session.");
            return;
        }


        alert(
            "Session created successfully.\n\n" +
            "Session ID: " + data.session_id
        );


        document.getElementById("subject").value = "";

        loadSessions();

    } catch (error) {

        alert("Could not connect to the backend.");
        console.error(error);
    }
}


// ==============================
// CLOSE SESSION
// ==============================

async function closeSession(sessionId) {

    const confirmClose =
        confirm(
            "Are you sure you want to close session " +
            sessionId +
            "?"
        );


    if (!confirmClose) {
        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/sessions/" +
                sessionId +
                "/close",
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.detail || "Could not close session.");
            return;
        }


        alert("Session closed successfully.");

        loadSessions();

    } catch (error) {

        alert("Could not connect to the backend.");
        console.error(error);
    }
}


// ==============================
// REOPEN SESSION
// ==============================

async function reopenSession(sessionId) {

    try {

        const response =
            await fetch(
                API_URL +
                "/sessions/" +
                sessionId +
                "/reopen",
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.detail || "Could not reopen session.");
            return;
        }


        alert("Session reopened successfully.");

        loadSessions();

    } catch (error) {

        alert("Could not connect to the backend.");
        console.error(error);
    }
}


// ==============================
// LOAD ATTENDANCE
// ==============================

async function loadAttendance() {

    try {

        const response =
            await fetch(API_URL + "/attendance");

        const attendance =
            await response.json();

        const table =
            document.getElementById("attendanceTable");

        if (!table) return;

        table.innerHTML = "";


        attendance.forEach(function(record) {

            const row =
                table.insertRow();


            row.insertCell(0).textContent =
                record.roll_no;

            row.insertCell(1).textContent =
                record.name;

            row.insertCell(2).textContent =
                record.division;

            row.insertCell(3).textContent =
                record.session_id;

            row.insertCell(4).textContent =
                record.date;

            row.insertCell(5).textContent =
                record.time;


            const statusCell =
                row.insertCell(6);


            const status =
                document.createElement("span");

            status.className =
                "status present";

            status.textContent =
                record.status;

            statusCell.appendChild(status);
        });

    } catch (error) {

        alert("Could not load attendance.");
        console.error(error);
    }
}


// ==============================
// REFRESH ATTENDANCE
// ==============================

function refreshAttendance() {
    loadAttendance();
}


// ==============================
// INITIAL ADMIN LOAD
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById("studentTable")
        ) {

            showSection("students");
        }
    }
);


// ==============================
// STUDENT PAGE
// ==============================

async function loadActiveSession() {

    try {

        const response =
            await fetch(API_URL + "/sessions/active");

        const session =
            await response.json();


        if (!session.active) {

            document.getElementById(
                "currentSubject"
            ).textContent = "No active session";

            document.getElementById(
                "currentSession"
            ).textContent = "-";

            return;
        }


        document.getElementById(
            "currentSubject"
        ).textContent = session.subject;


        document.getElementById(
            "currentSession"
        ).textContent = session.session_id;


    } catch (error) {

        console.error(error);

        document.getElementById(
            "currentSubject"
        ).textContent = "Unable to load";

        document.getElementById(
            "currentSession"
        ).textContent = "-";
    }
}


// ==============================
// MARK ATTENDANCE
// ==============================

async function markAttendance() {

    const rollNumber =
        document.getElementById(
            "studentRoll"
        ).value.trim();

    const result =
        document.getElementById(
            "attendanceResult"
        );


    if (rollNumber === "") {

        result.className =
            "attendance-result error";

        result.textContent =
            "Please enter your roll number.";

        return;
    }


    try {

        // Get current active session

        const sessionResponse =
            await fetch(
                API_URL + "/sessions/active"
            );


        const session =
            await sessionResponse.json();


        if (!session.active) {

            result.className =
                "attendance-result error";

            result.textContent =
                "There is no active attendance session.";

            return;
        }


        // Send attendance to backend

        const response =
            await fetch(
                API_URL + "/attendance",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        roll_no: rollNumber,
                        session_id: session.session_id
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            result.className =
                "attendance-result error";

            result.textContent =
                data.detail ||
                "Attendance could not be marked.";

            return;
        }


        // Success

        result.className =
            "attendance-result success";

        result.textContent =
            "✓ Attendance marked successfully for Roll Number " +
            rollNumber;

    } catch (error) {

        console.error(error);

        result.className =
            "attendance-result error";

        result.textContent =
            "Could not connect to the attendance server.";
    }
}


// ==============================
// CLEAR STUDENT FORM
// ==============================

function clearStudentForm() {

    document.getElementById(
        "studentRoll"
    ).value = "";


    const result =
        document.getElementById(
            "attendanceResult"
        );


    result.className =
        "attendance-result";

    result.textContent = "";
}


// ==============================
// LOAD STUDENT SESSION
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById(
                "studentRoll"
            )
        ) {

            loadActiveSession();
        }
    }
);