CREATE DATABASE  IF NOT EXISTS `securevoice` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `securevoice`;
-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: localhost    Database: securevoice
-- ------------------------------------------------------
-- Server version	8.0.34

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_cases`
--

DROP TABLE IF EXISTS `admin_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_cases` (
  `case_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `admin_username` varchar(100) NOT NULL,
  `complainant_username` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('pending','verifying','investigating','resolved') DEFAULT 'pending',
  PRIMARY KEY (`case_id`),
  UNIQUE KEY `unique_admin_complaint` (`complaint_id`,`admin_username`),
  KEY `fk_admin_case_admin` (`admin_username`),
  CONSTRAINT `fk_admin_case_admin` FOREIGN KEY (`admin_username`) REFERENCES `admins` (`username`) ON UPDATE CASCADE,
  CONSTRAINT `fk_admin_case_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_cases`
--

LOCK TABLES `admin_cases` WRITE;
/*!40000 ALTER TABLE `admin_cases` DISABLE KEYS */;
INSERT INTO `admin_cases` VALUES (1,1,'mahbe_nai','ifty90','2025-06-10 06:23:00','2025-06-26 16:51:44','pending'),(2,2,'mahbe_nai','ifty90','2025-06-11 02:42:00','2025-06-26 16:51:44','verifying'),(3,5,'mahbe_nai','siam_molla','2025-06-23 06:23:00','2025-06-26 16:51:44','verifying'),(4,6,'mahbe_nai','siam_molla','2025-06-26 10:24:00','2025-06-26 16:51:44','verifying'),(8,7,'mahbe_nai','ifty90','2025-06-27 11:44:08','2025-06-27 11:44:08','verifying'),(9,9,'mahbe_nai','ifty90','2025-06-30 08:48:25','2025-06-30 08:48:25','verifying');
/*!40000 ALTER TABLE `admin_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_settings`
--

DROP TABLE IF EXISTS `admin_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `admin_username` varchar(100) NOT NULL,
  `dark_mode` tinyint(1) DEFAULT '0',
  `email_notifications` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `unique_admin_settings` (`admin_username`),
  CONSTRAINT `admin_settings_ibfk_1` FOREIGN KEY (`admin_username`) REFERENCES `admins` (`username`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_settings`
--

LOCK TABLES `admin_settings` WRITE;
/*!40000 ALTER TABLE `admin_settings` DISABLE KEYS */;
INSERT INTO `admin_settings` VALUES (1,'mahbe_nai',1,1,'2025-06-20 08:58:10','2025-06-30 08:49:17'),(85,'ifty02',0,1,'2025-06-30 03:04:54','2025-06-30 08:24:46'),(86,'ifty90',1,1,'2025-06-30 03:46:49','2025-06-30 04:36:37');
/*!40000 ALTER TABLE `admin_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `adminid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `district_name` varchar(100) DEFAULT NULL,
  `dob` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `unique_admin_email` (`email`),
  UNIQUE KEY `unique_admin_username` (`username`),
  UNIQUE KEY `unique_adminid` (`adminid`),
  KEY `fk_admins_district_name` (`district_name`),
  CONSTRAINT `fk_admins_district_name` FOREIGN KEY (`district_name`) REFERENCES `districts` (`district_name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (5,'admin_mahbe','abu.mahbe2005@gmail.com','$2b$10$DT65YUDznXYcBkP4ZALSDuF5SNdy3hWd3TBGeCVV50WD3G.a50XWW','Abu Hurayra Mahbe','2025-06-11 09:15:47','Barishal','1999-10-11'),(7,'ifty02','amiifty00@gmail.com','$2b$10$BNYJ2KV3xqLT6UKTeGftmeN3c9miyR5JG5QLzquRR0s7AYZXS7HkS','Md iftykhar wahid ifty','2025-06-30 03:04:52','Sylhet','2003-05-17'),(4,'ifty90','mifty223881@bscse.uiu.ac.bd','$2b$10$V9LH8TbFwbm3y5Eo9QA5zeNkMzNNcBFfXJNEuKBrDU70f0bIYgwPC',NULL,'2025-05-26 08:22:44','Rajshahi',NULL),(1,'mahbe_nai','milonnahid@gmail.com','$2b$10$wCEXRhHxti4W2MFoHmS1LO/umtvlGckY0UCo6XW.Q5edaU6eVgGcG','Admin IFTY','2025-05-25 01:00:40','Dhaka','2000-01-29');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `unique_category_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Theft','Property theft and burglary cases','2025-05-31 14:18:00'),(2,'Harassment','Harassment and intimidation cases','2025-05-31 14:18:00'),(3,'Threat','Threatening behavior and verbal threats','2025-05-31 14:18:00'),(4,'Assault','Physical assault and battery cases','2025-05-31 14:18:00'),(5,'Fraud','Financial fraud and scam cases','2025-05-31 14:18:00'),(6,'Other','Other types of complaints not covered above','2025-05-31 14:18:00');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint`
--

DROP TABLE IF EXISTS `complaint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint` (
  `complaint_id` int NOT NULL AUTO_INCREMENT,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `status` enum('pending','verifying','investigating','resolved') DEFAULT 'pending',
  `username` varchar(100) DEFAULT NULL,
  `admin_username` varchar(100) DEFAULT NULL,
  `location_id` int DEFAULT NULL,
  `complaint_type` varchar(100) DEFAULT NULL,
  `location_address` text,
  `category_id` int DEFAULT NULL,
  PRIMARY KEY (`complaint_id`),
  KEY `username` (`username`),
  KEY `admin_username` (`admin_username`),
  KEY `location_id` (`location_id`),
  KEY `fk_complaint_category` (`category_id`),
  CONSTRAINT `complaint_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`),
  CONSTRAINT `complaint_ibfk_2` FOREIGN KEY (`admin_username`) REFERENCES `admins` (`username`),
  CONSTRAINT `complaint_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`),
  CONSTRAINT `fk_complaint_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint`
--

LOCK TABLES `complaint` WRITE;
/*!40000 ALTER TABLE `complaint` DISABLE KEYS */;
INSERT INTO `complaint` VALUES (1,'I was robbed near Mirpur-12 Metro Station','2025-06-10 12:23:00','pending','ifty90','mahbe_nai',1,'Theft','Road 4, Mirpur, Dhaka - 1216, Bangladesh',1),(2,'False Item Sold Near Arong in mirpur-12','2025-06-11 08:42:00','verifying','ifty90','mahbe_nai',2,'Fraud','harun molla college(হারুন মোল্লা কলেজ), ৫/১২ Road 2, Pallabi, Dhaka - 1216, Bangladesh',5),(5,'Threft Near Mirpur-14','2025-06-23 12:23:00','verifying','siam_molla','mahbe_nai',5,'Theft','police staff area, Mirpur road-14, Ibrahimpur, Dhaka - 1216, Bangladesh',1),(6,'A Women was Assaulted Near Mirpur-10','2025-06-26 16:24:00','verifying','siam_molla','mahbe_nai',6,'Assault','Mirpur-10 Circle, Mirpur, Dhaka - 1216, Bangladesh',4),(7,'sdfsdfsdf','2025-06-27 11:41:00','verifying','ifty90','mahbe_nai',7,'Harassment','Ceramic Avenue, Pallabi, Dhaka - 1216, Bangladesh',2),(8,'A bike was theft near a medical store','2025-06-30 03:42:00','pending','siam_molla','ifty90',8,'Theft',' Vodra, Padma Abashik,, (in front of Indian High Commission office), Rajshahi 6207',1),(9,'fraud things were sold in uiu','2025-06-30 08:45:00','verifying','ifty90','mahbe_nai',9,'Fraud','Road 14, Gulshan, Dhaka - 2467, Bangladesh',5);
/*!40000 ALTER TABLE `complaint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_chat`
--

DROP TABLE IF EXISTS `complaint_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_chat` (
  `chat_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `sender_type` enum('user','admin') NOT NULL,
  `sender_username` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`chat_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `complaint_chat_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_chat`
--

LOCK TABLES `complaint_chat` WRITE;
/*!40000 ALTER TABLE `complaint_chat` DISABLE KEYS */;
INSERT INTO `complaint_chat` VALUES (1,2,'admin','mahbe_nai','Hello user ifty','2025-06-17 19:41:06',0),(2,2,'user','ifty90','Hey','2025-06-17 19:41:35',0),(3,2,'user','ifty90','Did you checked my complain ?','2025-06-17 19:41:48',0),(4,2,'admin','mahbe_nai','yes i did','2025-06-17 19:42:02',0),(5,2,'admin','mahbe_nai','yes i did','2025-06-17 19:42:02',0),(6,1,'admin','mahbe_nai','Hello ?','2025-06-17 20:00:10',0),(7,1,'user','ifty90','Heyy','2025-06-17 20:01:05',0),(8,1,'user','ifty90','Hellow','2025-06-23 10:27:46',0),(9,7,'admin','mahbe_nai','hi','2025-06-27 11:44:21',0),(10,7,'admin','mahbe_nai','Can you explain the Description more','2025-06-27 11:48:03',0),(11,7,'admin','mahbe_nai','Can you explain the Description more','2025-06-27 11:48:03',0),(12,7,'admin','mahbe_nai','Hello?','2025-06-29 12:00:42',0),(13,7,'admin','mahbe_nai','hi','2025-06-29 14:39:32',0),(14,7,'admin','mahbe_nai','hi','2025-06-29 14:39:32',0),(15,5,'admin','mahbe_nai','Hello i need more information','2025-06-29 14:39:54',0),(16,5,'admin','mahbe_nai','Hello i need more information','2025-06-29 14:39:54',0),(17,5,'admin','mahbe_nai','Hello i need more information','2025-06-29 14:39:54',0),(18,5,'admin','mahbe_nai','Hello i need more information','2025-06-29 14:39:54',0),(19,5,'admin','mahbe_nai','Hello i need more information','2025-06-29 14:39:54',0),(20,5,'admin','mahbe_nai','hello','2025-06-29 14:40:00',0),(21,5,'admin','mahbe_nai','hello','2025-06-29 14:40:00',0),(22,5,'admin','mahbe_nai','hello','2025-06-29 14:40:00',0),(23,5,'admin','mahbe_nai','hello','2025-06-29 14:40:00',0),(24,5,'admin','mahbe_nai','hello','2025-06-29 14:40:00',0),(25,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(26,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(27,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(28,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(29,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(30,1,'admin','mahbe_nai','hi','2025-06-29 14:40:10',0),(31,7,'admin','mahbe_nai','hello','2025-06-29 18:45:10',0),(32,1,'admin','mahbe_nai','hey','2025-06-29 18:45:27',0),(33,7,'user','ifty90','yes?','2025-06-29 18:46:13',0),(34,8,'admin','ifty90','hi','2025-06-30 04:36:00',0),(35,8,'admin','ifty90','I need more information please','2025-06-30 04:36:15',0),(36,9,'admin','mahbe_nai','need more information','2025-06-30 08:48:37',0);
/*!40000 ALTER TABLE `complaint_chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaint_notifications`
--

DROP TABLE IF EXISTS `complaint_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaint_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `message` text NOT NULL,
  `type` enum('status_change','admin_comment','system') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `complaint_notifications_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaint_notifications`
--

LOCK TABLES `complaint_notifications` WRITE;
/*!40000 ALTER TABLE `complaint_notifications` DISABLE KEYS */;
INSERT INTO `complaint_notifications` VALUES (1,2,'Your complaint #2 status has been updated to: VERIFYING','status_change',1,'2025-06-17 19:19:21'),(2,2,'New message from admin regarding complaint #2','admin_comment',1,'2025-06-17 19:41:06'),(3,2,'New message from admin regarding complaint #2','admin_comment',1,'2025-06-17 19:42:02'),(4,2,'New message from admin regarding complaint #2','admin_comment',1,'2025-06-17 19:42:02'),(5,2,'Your complaint #2 status has been updated to: INVESTIGATING','status_change',1,'2025-06-17 20:00:01'),(6,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-17 20:00:10'),(7,1,'Your complaint #1 status has been updated to: PENDING','status_change',1,'2025-06-20 09:35:08'),(8,2,'Your complaint #2 status has been updated to: VERIFYING','status_change',1,'2025-06-23 10:28:46'),(9,5,'Your complaint #5 status has been updated to: VERIFYING','status_change',1,'2025-06-26 16:20:01'),(10,6,'Your complaint #6 status has been updated to: VERIFYING','status_change',1,'2025-06-26 16:27:30'),(11,6,'Your complaint #6 status has been updated to: PENDING','status_change',1,'2025-06-26 16:56:31'),(12,6,'Your complaint #6 status has been updated to: VERIFYING','status_change',1,'2025-06-26 17:34:14'),(13,7,'Your complaint #7 status has been updated to: VERIFYING','status_change',1,'2025-06-27 11:44:08'),(14,7,'New message from admin regarding complaint #7','admin_comment',1,'2025-06-29 14:39:32'),(15,7,'New message from admin regarding complaint #7','admin_comment',1,'2025-06-29 14:39:32'),(16,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:39:54'),(17,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:39:54'),(18,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:39:54'),(19,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:39:54'),(20,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:39:54'),(21,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:40:00'),(22,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:40:00'),(23,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:40:00'),(24,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:40:00'),(25,5,'New message from admin regarding complaint #5','admin_comment',1,'2025-06-29 14:40:00'),(26,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(27,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(28,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(29,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(30,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(31,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 14:40:10'),(32,7,'New message from admin regarding complaint #7','admin_comment',1,'2025-06-29 18:45:10'),(33,1,'New message from admin regarding complaint #1','admin_comment',1,'2025-06-29 18:45:27'),(34,8,'New message from admin regarding complaint #8','admin_comment',0,'2025-06-30 04:36:00'),(35,8,'New message from admin regarding complaint #8','admin_comment',0,'2025-06-30 04:36:15'),(36,9,'Your complaint #9 status has been updated to: VERIFYING','status_change',1,'2025-06-30 08:48:25'),(37,9,'New message from admin regarding complaint #9','admin_comment',1,'2025-06-30 08:48:37');
/*!40000 ALTER TABLE `complaint_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `districts`
--

DROP TABLE IF EXISTS `districts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `districts` (
  `district_name` varchar(100) NOT NULL,
  PRIMARY KEY (`district_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `districts`
--

LOCK TABLES `districts` WRITE;
/*!40000 ALTER TABLE `districts` DISABLE KEYS */;
INSERT INTO `districts` VALUES ('Barishal'),('Dhaka'),('Khulna'),('Rajshahi'),('Sylhet');
/*!40000 ALTER TABLE `districts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evidence`
--

DROP TABLE IF EXISTS `evidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evidence` (
  `evidence_id` int NOT NULL AUTO_INCREMENT,
  `uploaded_at` datetime DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `complaint_id` int DEFAULT NULL,
  PRIMARY KEY (`evidence_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `evidence_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evidence`
--

LOCK TABLES `evidence` WRITE;
/*!40000 ALTER TABLE `evidence` DISABLE KEYS */;
INSERT INTO `evidence` VALUES (1,'2025-06-02 09:21:33','image','D:\\Study\\DBMS Lab\\DBMS Project\\Actual Project\\uploads\\images\\1748856093642-305838290.jpg',1),(2,'2025-06-11 08:43:10','image','D:\\Study\\DBMS Lab\\DBMS Project\\Actual Project\\uploads\\images\\1749631390445-984248276.png',2),(5,'2025-06-23 12:24:35','image','D:\\Study\\DBMS Lab\\DBMS Project\\Actual Project\\uploads\\images\\1750681475246-819724832.jpg',5),(6,'2025-06-26 16:25:35','image','D:\\Study\\DBMS Lab\\DBMS Project\\Actual Project\\uploads\\images\\1750955135403-711317455.jpg',6),(7,'2025-06-27 11:42:23','image','D:\\Study\\DBMS Lab\\DBMS Project\\Actual Project\\uploads\\images\\1751024543710-513820996.jpg',7),(8,'2025-06-30 03:43:29','image','images/1751255009887-811284786.png',8),(9,'2025-06-30 08:46:07','image','images/1751273167297-597678811.jpg',9);
/*!40000 ALTER TABLE `evidence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `location_name` varchar(100) DEFAULT NULL,
  `district_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `fk_location_district_name` (`district_name`),
  CONSTRAINT `fk_location_district_name` FOREIGN KEY (`district_name`) REFERENCES `districts` (`district_name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (1,'Road 4, Mirpur, Dhaka - 1216, Bangladesh','Dhaka'),(2,'harun molla college(হারুন মোল্লা কলেজ), ৫/১২ Road 2, Pallabi, Dhaka - 1216, Bangladesh','Dhaka'),(3,'597 Jahanara Monjil,Nazrul Sorok, Nathullabad Barishal ,sadar','Barishal'),(4,'Robiul Telecom(রবিউল টেলিকম), ৫২/৪ Road 3, Mirpur, Dhaka - 1216, Bangladesh','Dhaka'),(5,'police staff area, Mirpur road-14, Ibrahimpur, Dhaka - 1216, Bangladesh','Dhaka'),(6,'Mirpur-10 Circle, Mirpur, Dhaka - 1216, Bangladesh','Dhaka'),(7,'Ceramic Avenue, Pallabi, Dhaka - 1216, Bangladesh','Dhaka'),(8,' Vodra, Padma Abashik,, (in front of Indian High Commission office), Rajshahi 6207','Rajshahi'),(9,'Road 14, Gulshan, Dhaka - 2467, Bangladesh','Dhaka');
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status_updates`
--

DROP TABLE IF EXISTS `status_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status_updates` (
  `update_id` int NOT NULL AUTO_INCREMENT,
  `status` enum('pending','verifying','investigating','resolved') DEFAULT NULL,
  `remarks` text,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `complaint_id` int DEFAULT NULL,
  PRIMARY KEY (`update_id`),
  KEY `fk_status_update_complaint` (`complaint_id`),
  KEY `fk_status_update_admin` (`updated_by`),
  CONSTRAINT `fk_status_update_admin` FOREIGN KEY (`updated_by`) REFERENCES `admins` (`username`) ON UPDATE CASCADE,
  CONSTRAINT `fk_status_update_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status_updates`
--

LOCK TABLES `status_updates` WRITE;
/*!40000 ALTER TABLE `status_updates` DISABLE KEYS */;
INSERT INTO `status_updates` VALUES (1,'verifying',NULL,'2025-06-11 20:32:44','mahbe_nai',1),(2,NULL,NULL,NULL,'mahbe_nai',NULL),(3,NULL,NULL,NULL,'mahbe_nai',NULL),(4,NULL,NULL,NULL,'mahbe_nai',NULL),(5,NULL,NULL,NULL,'mahbe_nai',NULL),(6,NULL,NULL,NULL,'mahbe_nai',NULL),(7,NULL,NULL,NULL,'mahbe_nai',NULL),(8,NULL,NULL,NULL,'mahbe_nai',NULL),(9,NULL,NULL,NULL,'mahbe_nai',NULL),(10,'verifying',NULL,'2025-06-18 01:19:21','mahbe_nai',2),(11,'investigating',NULL,'2025-06-18 02:00:01','mahbe_nai',2),(12,'pending',NULL,'2025-06-20 15:35:08','mahbe_nai',1),(13,'verifying',NULL,'2025-06-23 16:28:46','mahbe_nai',2),(14,'verifying',NULL,'2025-06-26 22:20:01','mahbe_nai',5),(15,'verifying',NULL,'2025-06-26 22:27:30','mahbe_nai',6),(16,'pending',NULL,'2025-06-26 22:56:31','mahbe_nai',6),(17,'verifying',NULL,'2025-06-26 23:34:14','mahbe_nai',6),(18,'verifying',NULL,'2025-06-27 17:44:08','mahbe_nai',7),(19,'verifying',NULL,'2025-06-30 14:48:25','mahbe_nai',9);
/*!40000 ALTER TABLE `status_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `age` int DEFAULT NULL,
  PRIMARY KEY (`username`),
  UNIQUE KEY `unique_user_email` (`email`),
  UNIQUE KEY `unique_user_username` (`username`),
  UNIQUE KEY `unique_userid` (`userid`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'ifty90','abu.mahbe2005@gmail.com','$2b$10$yoj6i.nYpcK1JWCgEQHWsezElq6i4BenLIX1wm2osV7bM8X/23Zyy','Abu Huraya Mahbe','+880-01917184401','2005-07-09','Road 2, Mirpur, Dhaka - 1216, Bangladesh','2025-05-17 01:05:59',19),(3,'siam_molla','mahbe.jackseptickeye@gmail.com','$2b$10$Fu8xilZZbB/AMlnw.x0R5O6HcmJw0/noGjBuzKAfMglvN8ydXhIVq','Siam Ahmed Molla','01917184400','2002-11-11','103 BIDC Rd, Khulna, Khulna Division, Bangladesh','2025-06-11 11:08:52',22);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-26 21:47:02
