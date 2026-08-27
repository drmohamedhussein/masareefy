<?php
/**
 * Plugin Name:       مصاريفي
 * Plugin URI:        https://example.com/masareefy
 * Description:       متتبع مصاريف شخصي لكل مستخدم في ووردبريس.
 * Version:           1.0.0
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

define('MASAREEFY_VERSION', '1.0.0');
define('MASAREEFY_PLUGIN_FILE', __FILE__);
define('MASAREEFY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MASAREEFY_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-repository.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-rest.php';
require_once MASAREEFY_PLUGIN_DIR . 'includes/class-masareefy-admin.php';

/**
 * Create the expenses table on activation.
 */
function masareefy_activate(): void {
	global $wpdb;

	$table_name      = $wpdb->prefix . 'masareefy_expenses';
	$charset_collate = $wpdb->get_charset_collate();

	$sql = "CREATE TABLE {$table_name} (
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

	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	dbDelta($sql);
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
