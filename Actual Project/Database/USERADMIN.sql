CREATE DATABASE IF NOT EXISTS SecureVoice;
USE SecureVoice;
CREATE TABLE IF NOT EXISTS users (
                                     userid INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(50) NOT NULL UNIQUE,
                                     email VARCHAR(100) NOT NULL UNIQUE,
                                     password VARCHAR(255) NOT NULL,
                                     fullName VARCHAR(100) DEFAULT NULL,
                                     phone VARCHAR(20) DEFAULT NULL,
                                     dob DATE DEFAULT NULL,
                                     age INT DEFAULT NULL,
                                     location VARCHAR(100) DEFAULT NULL,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins (
                                      adminid INT AUTO_INCREMENT PRIMARY KEY,
                                      username VARCHAR(50) NOT NULL UNIQUE,
                                      email VARCHAR(100) NOT NULL UNIQUE,
                                      password VARCHAR(255) NOT NULL,
                                      fullName VARCHAR(100) DEFAULT NULL,
                                      district VARCHAR(100) DEFAULT NULL,
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);