-- -----------------------------------------------------
-- Healthcare Management System DBMS
-- This schema implements all tables and features from the synopsis.
-- -----------------------------------------------------

-- Drop existing tables if they exist to start fresh
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

-- -----------------------------------------------------
-- Table `Users`
-- REQUIRED FOR AUTHENTICATION & ROLE-BASED ACCESS
-- This table links a login to a specific Patient, Doctor, or Admin.
-- -----------------------------------------------------
CREATE TABLE Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Username VARCHAR(100) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL, -- In a real app, this MUST be a hashed password
  Role ENUM('Patient', 'Doctor', 'Admin') NOT NULL,
  -- LinkedID connects this user to their specific profile (PatientID or DoctorID)
  LinkedID INT NULL 
);

-- -----------------------------------------------------
-- Table `Patients`
-- -----------------------------------------------------
CREATE TABLE Patients (
  PatientID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Age INT NOT NULL CHECK (Age > 0),
  Gender ENUM('Male', 'Female', 'Other') NOT NULL,
  Address VARCHAR(500),
  Contact VARCHAR(20) NOT NULL UNIQUE,
  RegistrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CurrentRoomID INT NULL, -- Patient's currently assigned room
  FOREIGN KEY (CurrentRoomID) REFERENCES Rooms(RoomID)
);

-- -----------------------------------------------------
-- Table `Doctors`
-- -----------------------------------------------------
CREATE TABLE Doctors (
  DoctorID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Specialization VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL UNIQUE
);

-- -----------------------------------------------------
-- Table `Rooms`
-- -----------------------------------------------------
CREATE TABLE Rooms (
  RoomID INT AUTO_INCREMENT PRIMARY KEY,
  RoomType ENUM('General Ward', 'Private', 'ICU') NOT NULL,
  Status ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  PatientID INT NULL, -- The patient currently in this room
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- -----------------------------------------------------
-- Table `Nurses`
-- -----------------------------------------------------
CREATE TABLE Nurses (
  NurseID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL,
  AssignedDoctorID INT,
  FOREIGN KEY (AssignedDoctorID) REFERENCES Doctors(DoctorID)
);

-- -----------------------------------------------------
-- Table `WardBoys`
-- -----------------------------------------------------
CREATE TABLE WardBoys (
  WardBoyID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Contact VARCHAR(20) NOT NULL,
  AssignedDoctorID INT,
  FOREIGN KEY (AssignedDoctorID) REFERENCES Doctors(DoctorID)
);

-- -----------------------------------------------------
-- Table `Diagnoses` (M:N between Patients and Doctors)
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- Table `Assignments` (M:N between Staff and Patients)
-- -----------------------------------------------------
CREATE TABLE Assignments (
  AssignmentID INT AUTO_INCREMENT PRIMARY KEY,
  StaffID INT NOT NULL, -- This can be a NurseID or WardBoyID
  PatientID INT NOT NULL,
  Role ENUM('Nurse', 'WardBoy') NOT NULL,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
  -- Note: We can't add a direct FK for StaffID as it refers to two tables.
  -- This would be enforced at the application layer or with triggers.
);

-- -----------------------------------------------------
-- Table `Payments`
-- -----------------------------------------------------
CREATE TABLE Payments (
  PaymentID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  Amount DECIMAL(10, 2) NOT NULL,
  PaymentMode ENUM('Cash', 'E-Banking', 'Card') NOT NULL,
  PaymentDate DATETIME,
  Status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);

-- -----------------------------------------------------
-- Table `EmergencyCare`
-- -----------------------------------------------------
CREATE TABLE EmergencyCare (
  EmergencyID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  DoctorID INT NOT NULL,
  Details TEXT NOT NULL,
  AdmissionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID),
  FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID)
);

-- -----------------------------------------------------
-- Table `SupportGroups`
-- -----------------------------------------------------
CREATE TABLE SupportGroups (
  GroupID INT AUTO_INCREMENT PRIMARY KEY,
  GroupName VARCHAR(200) NOT NULL,
  Description TEXT,
  MeetingTime VARCHAR(100)
);

-- -----------------------------------------------------
-- Table `SupportCalls`
-- -----------------------------------------------------
CREATE TABLE SupportCalls (
  CallID INT AUTO_INCREMENT PRIMARY KEY,
  PatientID INT NOT NULL,
  CallDetails TEXT NOT NULL,
  CallDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (PatientID) REFERENCES Patients(PatientID)
);


-- -----------------------------------------------------
-- ADVANCED DBMS FEATURES (as per synopsis)
-- -----------------------------------------------------

-- 1. VIEW: For admitted patients
CREATE VIEW v_admitted_patients AS
SELECT 
    P.Name AS PatientName,
    P.Age,
    P.Gender,
    R.RoomID,
    R.RoomType,
    D.Name AS DoctorName
FROM Patients P
JOIN Rooms R ON P.CurrentRoomID = R.RoomID
JOIN Diagnoses Diag ON P.PatientID = Diag.PatientID
JOIN Doctors D ON Diag.DoctorID = D.DoctorID
WHERE R.Status = 'Occupied'
GROUP BY P.PatientID;

-- 2. VIEW: For pending payments
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

-- 3. STORED PROCEDURE: To admit a patient to a room (demonstrates TCL)
DELIMITER $$
CREATE PROCEDURE sp_admit_patient (IN p_PatientID INT, IN p_RoomID INT)
BEGIN
    -- Start a transaction
    START TRANSACTION;
    
    UPDATE Rooms 
    SET Status = 'Occupied', PatientID = p_PatientID 
    WHERE RoomID = p_RoomID AND Status = 'Available';
    
    UPDATE Patients 
    SET CurrentRoomID = p_RoomID 
    WHERE PatientID = p_PatientID;
    
    -- Commit the transaction
    COMMIT;
END$$
DELIMITER ;

-- 4. TRIGGER: Automatically update room status when a patient is discharged
-- We'll base "discharge" on the patient's room being set to NULL
DELIMITER $$
CREATE TRIGGER trg_after_patient_discharge
AFTER UPDATE ON Patients
FOR EACH ROW
BEGIN
    -- If the patient's room was changed from a value to NULL (discharged)
    IF OLD.CurrentRoomID IS NOT NULL AND NEW.CurrentRoomID IS NULL THEN
        UPDATE Rooms 
        SET Status = 'Available', PatientID = NULL 
        WHERE RoomID = OLD.CurrentRoomID;
    END IF;
END$$
DELIMITER ;

-- 5. USER MANAGEMENT (DCL): Example comments
-- CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON HealthcareDB.* TO 'admin_user'@'localhost';

-- CREATE USER 'doctor_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT, INSERT, UPDATE ON HealthcareDB.Diagnoses TO 'doctor_user'@'localhost';
-- GRANT SELECT ON HealthcareDB.Patients TO 'doctor_user'@'localhost';

-- CREATE USER 'patient_user'@'localhost' IDENTIFIED BY 'password';
-- GRANT SELECT ON HealthcareDB.Diagnoses TO 'patient_user'@'localhost' WHERE PatientID = [linked_id];
-- (More complex row-level security is often handled at the application layer)