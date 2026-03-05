function loadDashboard() {

    // ===== STEP 1: API CALL SIMULATION =====
    let attendanceData = [
        { date: "2025-02-01", status: "present", hours: 8 },
        { date: "2025-02-02", status: "present", hours: 7 },
        { date: "2025-02-03", status: "absent", hours: 0 },
        { date: "2025-02-04", status: "late", hours: 6 },
        { date: "2025-02-05", status: "present", hours: 8 }
    ];

    // ===== STEP 2: CALCULATE TOTAL WORKING DAYS =====
    let totalDays = attendanceData.length;

    // ===== STEP 3: CALCULATE PRESENT, ABSENT, LATE =====
    let presentDays = attendanceData.filter(a => a.status === "present").length;
    let absentDays = attendanceData.filter(a => a.status === "absent").length;
    let lateDays = attendanceData.filter(a => a.status === "late").length;

    // ===== STEP 4: CALCULATE ATTENDANCE PERCENTAGE =====
    let attendancePercent = ((presentDays / totalDays) * 100).toFixed(2);

    // ===== STEP 5: CALCULATE WORKING HOURS =====
    let workingHours = attendanceData.reduce((sum, a) => sum + a.hours, 0);

    // ===== STEP 6: SHOW DATA IN DASHBOARD =====
    document.getElementById("totalDays").innerText = totalDays;
    document.getElementById("presentDays").innerText = presentDays;
    document.getElementById("absentDays").innerText = absentDays;
    document.getElementById("lateDays").innerText = lateDays;
    document.getElementById("attendancePercent").innerText = attendancePercent;
    document.getElementById("workingHours").innerText = workingHours;
}
