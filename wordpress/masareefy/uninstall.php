<?php
/**
 * Uninstall Masareefy — drop plugin table only.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}

global $wpdb;

$table_name = $wpdb->prefix . 'masareefy_expenses';

// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is derived from $wpdb->prefix.
$wpdb->query("DROP TABLE IF EXISTS {$table_name}");
