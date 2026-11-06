const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Hypocrite555",
    database: "school_fee_management"
});

db.connect((err) => {
    if (err) {
        console.error("MySQL connection failed:", err.message);
        return;
    }
    console.log("Connected to MySQL database");
});

// Dashboard totals
app.get("/api/dashboard", (req, res) => {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COALESCE(SUM(total_amount),0) FROM fee_details) AS total_fees,
        (SELECT COALESCE(SUM(amount_paid),0) FROM payments) AS collected_fees,
        (SELECT COALESCE(SUM(f.total_amount),0)
           FROM fee_details f) -
        (SELECT COALESCE(SUM(amount_paid),0) FROM payments) AS pending_fees
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows[0]);
    });
});

// Get and add students
app.get("/api/students", (req, res) => {
    db.query("SELECT * FROM students ORDER BY student_id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post("/api/students", (req, res) => {
    const { name, class: studentClass, rollno, phone, email } = req.body;
    if (!name || !studentClass || !rollno) {
        return res.status(400).json({ error: "Name, class and roll number are required" });
    }
    const sql = "INSERT INTO students (name, class, rollno, phone, email) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, studentClass, rollno, phone || null, email || null], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Student added successfully", student_id: result.insertId });
    });
});

// Get fee records with student name and calculated balance
app.get("/api/fees", (req, res) => {
    const sql = `
      SELECT f.fee_id, f.student_id, s.name, s.class, s.rollno,
             f.academic_year, f.fee_type, f.total_amount, f.due_date,
             COALESCE(SUM(p.amount_paid),0) AS amount_paid,
             f.total_amount - COALESCE(SUM(p.amount_paid),0) AS balance
      FROM fee_details f
      JOIN students s ON s.student_id = f.student_id
      LEFT JOIN payments p ON p.fee_id = f.fee_id
      GROUP BY f.fee_id
      ORDER BY f.fee_id DESC`;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Assign fee
app.post("/api/fees", (req, res) => {
    const { student_id, academic_year, fee_type, total_amount, due_date } = req.body;
    if (!student_id || !academic_year || !fee_type || !total_amount || !due_date) {
        return res.status(400).json({ error: "Please fill all fee details" });
    }
    const sql = `INSERT INTO fee_details
      (student_id, academic_year, fee_type, total_amount, due_date)
      VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [student_id, academic_year, fee_type, total_amount, due_date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Fee assigned successfully", fee_id: result.insertId });
    });
});

// Record a payment
app.post("/api/payments", (req, res) => {
    const { fee_id, amount_paid, payment_date, payment_method, receipt_no } = req.body;
    if (!fee_id || !amount_paid || !payment_date || !payment_method || !receipt_no) {
        return res.status(400).json({ error: "Please fill all payment details" });
    }

    const balanceSql = `
      SELECT f.total_amount - COALESCE(SUM(p.amount_paid),0) AS balance
      FROM fee_details f
      LEFT JOIN payments p ON p.fee_id = f.fee_id
      WHERE f.fee_id = ?
      GROUP BY f.fee_id`;

    db.query(balanceSql, [fee_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: "Fee record not found" });
        if (Number(amount_paid) > Number(rows[0].balance)) {
            return res.status(400).json({ error: "Payment cannot exceed the pending balance" });
        }
        const sql = `INSERT INTO payments
          (fee_id, amount_paid, payment_date, payment_method, receipt_no)
          VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [fee_id, amount_paid, payment_date, payment_method, receipt_no], (insertErr, result) => {
            if (insertErr) return res.status(500).json({ error: insertErr.message });
            res.status(201).json({ message: "Payment recorded successfully", payment_id: result.insertId });
        });
    });
});

// Individual student fee report
app.get("/api/reports/:studentId", (req, res) => {
    const sql = `
      SELECT s.student_id, s.name, s.class, s.rollno, s.phone, s.email,
             f.fee_id, f.academic_year, f.fee_type, f.total_amount, f.due_date,
             COALESCE(SUM(p.amount_paid),0) AS amount_paid,
             f.total_amount - COALESCE(SUM(p.amount_paid),0) AS balance
      FROM students s
      LEFT JOIN fee_details f ON f.student_id = s.student_id
      LEFT JOIN payments p ON p.fee_id = f.fee_id
      WHERE s.student_id = ?
      GROUP BY s.student_id, f.fee_id
      ORDER BY f.due_date`;
    db.query(sql, [req.params.studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows.length) return res.status(404).json({ error: "Student not found" });
        res.json(rows);
    });
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
