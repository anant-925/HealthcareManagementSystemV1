-- -----------------------------------------------------
-- Healthcare Management System DBMS (FINAL COMPLETE VERSION)
-- Includes: Users, Staff, Patients, Rooms, Billing, Support, Emergency, and Appointments
-- -----------------------------------------------------

-- Drop tables in an order that respects dependencies (or just turn off checks)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Appointments;
DROP TABLE IF EXISTS SupportCalls;
DROP TABLE IF EXISTS SupportGroups;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Assignments;
DROP TABLE IF EXISTS EmergencyCare;
DROP TABLE IF EXISTS Diagnoses;
DROP TABLE IF EXISTS WardBoys;
DROP TABLE IF EXISTS Nurses;
DROP TABLE IF EXISTS Rooms;
DROP TABLE IF EXISTS Doctors;
DROP TABLE IF EXISTS Patients;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 1. Core Tables (Independent)
-- -----------------------------------------------------

-- Users: Handles login for all roles
CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(100) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL, -- Stores bcrypt hash
  Role ENUM('Patient', 'Doctor', 'Admin') NOT NULL,
  LinkedID INT NULL -- Links to PatientID or DoctorID
);

-- Doctors: Staff profile
CREATE TABLE Doctors (
  DoctorID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Specialization VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL UNIQUE
);

-- SupportGroups: Available groups for patients
CREATE TABLE SupportGroups (
  GroupID INT AUTO_INCREMENT PRIMARY KEY,
  GroupName VARCHAR(200) NOT NULL,
  Description TEXT,
  MeetingTime VARCHAR(100)
);

-- -----------------------------------------------------
-- 2. Dependent Staff Tables
-- -----------------------------------------------------

CREATE TABLE Nurses (
  NurseID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL,
  AssignedDoctorID INT,
  FOREIGN KEY (AssignedDoctorID) REFERENCES Doctors(DoctorID)
);

CREATE TABLE WardBoys (
  WardBoyID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL,
  AssignedDoctorID INT,
  FOREIGN KEY (AssignedDoctorID) REFERENCES Doctors(DoctorID)
);

-- -----------------------------------------------------
-- 3. Patient & Room Tables (Circular Dependency Handling)
-- -----------------------------------------------------

-- Create Patients first (without Room FK)
CREATE TABLE Patients (
  PatientID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Age INT NOT NULL CHECK (Age > 0),
  Gender ENUM('Male', 'Female', 'Other') NOT NULL,
  Address VARCHAR(500),
  Contact VARCHAR(20) NOT NULL UNIQUE,
  RegistrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CurrentRoomID INT NULL
);

-- Create Rooms (referencing Patients)
CREATE TABLE Rooms (
  RoomID INT AUTO_INCREMENT PRIMARY KEY,
  RoomType ENUM('General Ward', 'Private', 'ICU') NOT NULL,
  Status ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  PatientID INT NULL,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- Add the missing FK to Patients
ALTER TABLE Patients
ADD CONSTRAINT fk_patients_room
FOREIGN KEY (CurrentRoomID) REFERENCES Rooms(RoomID);

-- -----------------------------------------------------
-- 4. Operational Tables (Linking Patients, Staff, etc.)
-- -----------------------------------------------------

-- Diagnoses: Medical history records
CREATE TABLE Diagnoses (
  DiagnosisID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  DoctorID INT NOT NULL,
  Disease VARCHAR(300) NOT NULL,
  Prescription TEXT,
  DiagnosisDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
  FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID)
);

-- Assignments: Nurses/WardBoys assigned to Patients
CREATE TABLE Assignments (
  AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
  StaffID INT NOT NULL,
  PatientID INT NOT NULL,
  Role ENUM('Nurse', 'WardBoy') NOT NULL,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- Payments: Billing records
CREATE TABLE Payments (
  PaymentID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  Amount DECIMAL(10, 2) NOT NULL,
  PaymentMode ENUM('Cash', 'E-Banking', 'Card') NOT NULL,
  PaymentDate DATETIME,
  Status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- EmergencyCare: Logs for emergency cases
CREATE TABLE EmergencyCare (
  EmergencyID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  DoctorID INT NOT NULL,
  Details TEXT NOT NULL,
  AdmissionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
  FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID)
);

-- SupportCalls: Logs for helpline calls
CREATE TABLE SupportCalls (
  CallID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  CallDetails TEXT NOT NULL,
  CallDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- Appointments: Scheduling system (NEW)
CREATE TABLE Appointments (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
    PatientID INT NOT NULL,
    DoctorID INT NOT NULL,
    AppointmentDate DATETIME NOT NULL,
    Reason TEXT,
    Status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID),
    INDEX idx_appt_date (AppointmentDate),
    INDEX idx_appt_doctor (DoctorID)
);

-- -----------------------------------------------------
-- 5. ADVANCED DBMS FEATURES
-- -----------------------------------------------------

-- View 1: For admitted patients (Admin Room Management)
CREATE VIEW v_admitted_patients AS
SELECT 
    P.Name AS PatientName,
    P.Age,
    P.Gender,
    P.PatientID,
    R.RoomID,
    R.RoomType,
    (SELECT D.Name FROM Doctors D JOIN Diagnoses Diag ON D.DoctorID = Diag.DoctorID WHERE Diag.PatientID = P.PatientID ORDER BY Diag.DiagnosisDate DESC LIMIT 1) AS DoctorName
FROM Patients P
JOIN Rooms R ON P.CurrentRoomID = R.RoomID
WHERE R.Status = 'Occupied';

-- View 2: For pending payments (Admin Billing)
CREATE VIEW v_pending_payments AS
SELECT 
    P.PatientID,
    P.Name AS PatientName,
    P.Contact,
    SUM(Pay.Amount) AS TotalDue
FROM Patients P
JOIN Payments Pay ON P.PatientID = Pay.PatientID
WHERE Pay.Status = 'Pending'
GROUP BY P.PatientID;

-- Stored Procedure: To admit a patient (Transaction)
DELIMITER $$
CREATE PROCEDURE sp_admit_patient (IN p_PatientID INT, IN p_RoomID INT)
BEGIN
    START TRANSACTION;
    UPDATE Rooms SET Status = 'Occupied', PatientID = p_PatientID WHERE RoomID = p_RoomID AND Status = 'Available';
    UPDATE Patients SET CurrentRoomID = p_RoomID WHERE PatientID = p_PatientID;
    COMMIT;
END$$
DELIMITER ;

-- Trigger: Update room status on discharge
DELIMITER $$
CREATE TRIGGER trg_after_patient_discharge
AFTER UPDATE ON Patients
FOR EACH ROW
BEGIN
    IF OLD.CurrentRoomID IS NOT NULL AND NEW.CurrentRoomID IS NULL THEN
        UPDATE Rooms SET Status = 'Available', PatientID = NULL WHERE RoomID = OLD.CurrentRoomID;
    END IF;
END$$
DELIMITER ;