const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require("multer");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// =========== DATABASE CONNECTION =============

const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Karthika@1016",
  database: "hrms_data"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("MySQL Connected");
});


// ========== SESSION CONFIG ============

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'hrms-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
    secure: false
  }
}));


// ========== ROLE MIDDLEWARE ==========

function ensureLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.redirect('/access-denied');
    }
    next();
  };
}


// ========== STATIC FILES (ROOT FOLDER) ==========

app.use(express.static(path.join(__dirname, '../')));


// ========== LOGIN USERS ===========

const users = [
  { id: 1, username: 'superadmin', password: 'super123', role: 'SUPERADMIN' },
  { id: 2, username: 'admin', password: 'admin123', role: 'ADMIN' },
  { id: 3, username: 'employee', password: 'emp123', role: 'EMPLOYEE' }
];


// ========== FILE UPLOAD ==========

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage });


// ========== ROUTES ==========

// HOME
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});


// LOGIN LOGIC
app.post('/login', (req, res) => {

  const { userId, password } = req.body;

  const user = users.find(
    u => u.username === userId && u.password === password
  );

  if (!user) {
    return res.send('<h3>Invalid login. <a href="/">Try again</a></h3>');
  }

  req.session.user = user;

  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') {
    return res.redirect('/admin-dashboard');
  }

  if (user.role === 'EMPLOYEE') {
    return res.redirect('/employee-dashboard');
  }

});


// DASHBOARD PAGES

app.get('/admin-dashboard',
  ensureLoggedIn,
  allowRoles('ADMIN', 'SUPERADMIN'),
  (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-dashboard.html'));
  }
);

app.get('/employee-dashboard',
  ensureLoggedIn,
  allowRoles('EMPLOYEE'),
  (req, res) => {
    res.sendFile(path.join(__dirname, '../employee-dashboard.html'));
  }
);


// OTHER PAGES

app.get('/referral', ensureLoggedIn, allowRoles('ADMIN', 'SUPERADMIN'), (req, res) => {
  res.sendFile(path.join(__dirname, '../referral.html'));
});

app.get('/lineup', ensureLoggedIn, allowRoles('ADMIN', 'SUPERADMIN'), (req, res) => {
  res.sendFile(path.join(__dirname, '../lineup.html'));
});

app.get('/onboardingsample', ensureLoggedIn, allowRoles('ADMIN', 'SUPERADMIN'), (req, res) => {
  res.sendFile(path.join(__dirname, '../onboardingsample.html'));
});

app.get('/payslip', ensureLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, '../payslip.html'));
});

app.get('/offer-letter', ensureLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, '../offer-letter.html'));
});

app.get('/ticket', ensureLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, '../ticket.html'));
});


// LOGOUT

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});


// ========== ATTENDANCE API ==========

app.get("/api/attendance-summary/:employeeId", ensureLoggedIn, (req, res) => {

  const employeeId = req.params.employeeId;

  const sql = `
    SELECT date, status, check_in, check_out
    FROM attendance_master
    WHERE employee_id = ?
  `;

  db.query(sql, [employeeId], (err, results) => {

    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    let totalWorkingDays = results.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let totalHours = 0;

    results.forEach(row => {

      if (row.status === "Present") present++;
      if (row.status === "Absent") absent++;

      if (row.status === "Late") {
        late++;
        present++;
      }

      if (row.check_in && row.check_out) {
        let start = new Date("2025-01-01 " + row.check_in);
        let end = new Date("2025-01-01 " + row.check_out);

        let diff = (end - start) / (1000 * 60 * 60);

        totalHours += diff;
      }

    });

    let attendancePercentage =
      totalWorkingDays > 0
        ? ((present / totalWorkingDays) * 100).toFixed(2)
        : 0;

    res.json({
      totalWorkingDays,
      present,
      absent,
      late,
      attendancePercentage,
      totalHours: totalHours.toFixed(2)
    });

  });

});


// ========== START SERVER ==========

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
