CREATE DATABASE IF NOT EXISTS school_fee_management;
USE school_fee_management;

CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    class VARCHAR(20) NOT NULL,
    rollno VARCHAR(20) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS fee_details (
    fee_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    fee_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    FOREIGN KEY (fee_id) REFERENCES fee_details(fee_id)
);

-- Optional sample students
INSERT INTO students (name, class, rollno, phone, email) VALUES
('Rahul', '10', '101', '9876543210', 'rahul@example.com'),
('Priya', '9', '102', '9876501234', 'priya@example.com');
