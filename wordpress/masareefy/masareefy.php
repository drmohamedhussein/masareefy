<?php
/**
 * Plugin Name:       Masareefy
 * Plugin URI:        https://masareefy.app
 * Description:       Personal expense tracker and freelancer work log for WordPress site owners.
 * Version:           1.2.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Masareefy
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       masareefy
 * Domain Path:       /languages
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

define('MASAREEFY_VERSION', '1.2.0');
define('MASAREEFY_PLUGIN_FILE', __FILE__);
define('MASAREEFY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MASAREEFY_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-repository.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-work-log.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-sync.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-rest.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-admin.php';

/**
 * Create database tables on activation.
 */
function masareefy_activate(): void {
	global $wpdb;

	$charset_collate = $wpdb->get_charset_collate();

	$expenses_table = $wpdb->prefix . 'masareefy_expenses';
	$work_log_table = $wpdb->prefix . 'masareefy_work_log';

	$sql_expenses = "CREATE TABLE {$expenses_table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		user_id bigint(20) unsigned NOT NULL,
		amount decimal(12,2) DEFAULT NULL,
		item_name varchar(255) NOT NULL DEFAULT '',
		tags text,
		notes text,
		spent_on date NOT NULL,
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY  (id),
		KEY user_spent_on (user_id, spent_on)
	) {$charset_collate};";

	$sql_work_log = "CREATE TABLE {$work_log_table} (
		id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
		title varchar(255) NOT NULL DEFAULT '',
		description text,
		status varchar(32) NOT NULL DEFAULT 'done',
		worked_on date NOT NULL,
		hours decimal(6,2) DEFAULT NULL,
		external_id varchar(64) DEFAULT NULL,
		source varchar(32) NOT NULL DEFAULT 'manual',
		created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		PRIMARY KEY  (id),
		KEY worked_on (worked_on),
		KEY external_id (external_id)
	) {$charset_collate};";

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta($sql_expenses);
	dbDelta($sql_work_log);
}

register_activation_hook(__FILE__, 'masareefy_activate');

/**
 * Bootstrap plugin components.
 */
function masareefy_init(): void {
	Masareefy_Admin::register();
	Masareefy_REST::register();
}

add_action('plugins_loaded', 'masareefy_init');
