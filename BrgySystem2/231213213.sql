SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'Administrator',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


INSERT INTO `admins` (`admin_id`, `username`, `password`, `role`, `created_at`) VALUES
(1, 'Secretary', '$2y$10$r0vpdQogUnkDxGhRI5z0KuvQhi9jPO6BGcPGe/LKHBXg.6nXhRHfS', 'Secretary', '2026-09-16 12:12:30'),
(2, 'Captain', '$2y$10$r0vpdQogUnkDxGhRI5z0KuvQhi9jPO6BGcPGe/LKHBXg.6nXhRHfS', 'Barangay Captain', '2026-10-08 13:11:14');


CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `incident_id` varchar(20) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `performed_by` varchar(255) NOT NULL,
  `old_data` longtext DEFAULT NULL,
  `new_data` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `incidents` (
  `id` varchar(10) NOT NULL,
  `incident_date` varchar(20) DEFAULT NULL,
  `incident_time` varchar(20) DEFAULT NULL,
  `incident_type` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `complainant` varchar(150) DEFAULT NULL,
  `respondent` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  `recorded_by` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `secretary_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `captain_archived` tinyint(1) NOT NULL DEFAULT 0,
  `captain_archive_reason` text DEFAULT NULL,
  `captain_archived_by` varchar(255) DEFAULT NULL,
  `captain_archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `incident_edit_requests` (
  `request_id` int(11) NOT NULL,
  `incident_id` varchar(10) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `reason` text NOT NULL,
  `old_data` longtext NOT NULL,
  `proposed_data` longtext NOT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `review_reason` text DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`);


ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `incidents`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `incident_edit_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `incident_id` (`incident_id`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `reviewed_by` (`reviewed_by`);


ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;


ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

ALTER TABLE `incident_edit_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;


ALTER TABLE `incident_edit_requests`
  ADD CONSTRAINT `fk_edit_request_incident` FOREIGN KEY (`incident_id`) REFERENCES `incidents` (`id`),
  ADD CONSTRAINT `fk_edit_request_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `admins` (`admin_id`),
  ADD CONSTRAINT `fk_edit_request_user` FOREIGN KEY (`requested_by`) REFERENCES `admins` (`admin_id`);
COMMIT;

