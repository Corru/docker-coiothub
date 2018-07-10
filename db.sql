SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(32) CHARACTER SET ascii NOT NULL,
  `password` varchar(64) CHARACTER SET ascii DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `device` varchar(32) CHARACTER SET ascii NOT NULL,
  `key` varchar(64) CHARACTER SET ascii DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

CREATE TABLE `statistics` (
  `id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `type` varchar(64) CHARACTER SET ascii NOT NULL,
  `value` varchar(64) CHARACTER SET ascii NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

CREATE TABLE `device_ownership` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

CREATE TABLE `workers` (
  `id` int(11) NOT NULL,
  `name` varchar(32) CHARACTER SET ascii NOT NULL,
  `ip` varchar(16) CHARACTER SET ascii NOT NULL,
  `key` varchar(64) CHARACTER SET ascii DEFAULT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

CREATE TABLE `worker_ownership` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `worker_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_520_ci;

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `se_username` (`username`);

ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `statistics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fo_statistics_device_id` (`device_id`);

ALTER TABLE `device_ownership`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `se_device_ownership` (`user_id`,`device_id`) USING BTREE,
  ADD KEY `fo_device_ownership_device_id` (`device_id`);

ALTER TABLE `workers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `se_workername` (`name`);

ALTER TABLE `worker_ownership`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `se_worker_ownership` (`user_id`,`worker_id`) USING BTREE,
  ADD KEY `fo_worker_ownership_worker_id` (`worker_id`);

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `device_ownership`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `workers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `worker_ownership`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `statistics`
  ADD CONSTRAINT `fo_statistics_device_id` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `device_ownership`
  ADD CONSTRAINT `fo_device_ownership_device_id` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fo_device_ownership_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `worker_ownership`
  ADD CONSTRAINT `fo_worker_ownership_worker_id` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fo_worker_ownership_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
