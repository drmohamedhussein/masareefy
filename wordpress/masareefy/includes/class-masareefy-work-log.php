<?php
/**
 * Work log repository — freelancer tasks visible to site owner.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

/**
 * CRUD for site work log entries.
 */
class Masareefy_Work_Log_Repository {

	/**
	 * @return string
	 */
	private static function table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'masareefy_work_log';
	}

	/**
	 * @param array<string,mixed> $row Raw row.
	 * @return array<string,mixed>
	 */
	private static function format_row(array $row): array {
		return array(
			'id'          => (int) $row['id'],
			'title'       => (string) $row['title'],
			'description' => (string) $row['description'],
			'status'      => (string) $row['status'],
			'worked_on'   => (string) $row['worked_on'],
			'hours'       => $row['hours'] !== null ? (float) $row['hours'] : null,
			'external_id' => $row['external_id'] ? (string) $row['external_id'] : null,
			'source'      => (string) $row['source'],
			'created_at'  => (string) $row['created_at'],
			'updated_at'  => (string) $row['updated_at'],
		);
	}

	/**
	 * @return array<int,array<string,mixed>>
	 */
	public function get_all(): array {
		global $wpdb;
		$table = self::table_name();
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$rows  = $wpdb->get_results("SELECT * FROM {$table} ORDER BY worked_on DESC, id DESC", ARRAY_A);
		if (! is_array($rows)) {
			return array();
		}
		return array_map(array( self::class, 'format_row' ), $rows);
	}

	/**
	 * @param int $id Entry ID.
	 * @return array<string,mixed>|null
	 */
	public function get_by_id(int $id): ?array {
		global $wpdb;
		$table = self::table_name();
		$row   = $wpdb->get_row(
			$wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $id),
			ARRAY_A
		);
		return is_array($row) ? self::format_row($row) : null;
	}

	/**
	 * @param array<string,mixed> $data Input.
	 * @return array<string,mixed>|null
	 */
	public function create(array $data): ?array {
		global $wpdb;
		$title = sanitize_text_field((string) ($data['title'] ?? ''));
		if ($title === '') {
			return null;
		}
		$inserted = $wpdb->insert(
			self::table_name(),
			array(
				'title'       => $title,
				'description' => sanitize_textarea_field((string) ($data['description'] ?? '')),
				'status'      => sanitize_key((string) ($data['status'] ?? 'done')),
				'worked_on'   => sanitize_text_field((string) ($data['worked_on'] ?? gmdate('Y-m-d'))),
				'hours'       => isset($data['hours']) ? (float) $data['hours'] : null,
				'external_id' => isset($data['external_id']) ? sanitize_text_field((string) $data['external_id']) : null,
				'source'      => sanitize_key((string) ($data['source'] ?? 'manual')),
			),
			array( '%s', '%s', '%s', '%s', '%f', '%s', '%s' )
		);
		if (! $inserted) {
			return null;
		}
		return $this->get_by_id((int) $wpdb->insert_id);
	}

	/**
	 * @param int                   $id   Entry ID.
	 * @param array<string,mixed> $data Patch.
	 * @return array<string,mixed>|null
	 */
	public function update(int $id, array $data): ?array {
		global $wpdb;
		$fields = array();
		$formats = array();
		if (isset($data['title'])) {
			$fields['title'] = sanitize_text_field((string) $data['title']);
			$formats[]       = '%s';
		}
		if (isset($data['description'])) {
			$fields['description'] = sanitize_textarea_field((string) $data['description']);
			$formats[]           = '%s';
		}
		if (isset($data['status'])) {
			$fields['status'] = sanitize_key((string) $data['status']);
			$formats[]        = '%s';
		}
		if (isset($data['worked_on'])) {
			$fields['worked_on'] = sanitize_text_field((string) $data['worked_on']);
			$formats[]           = '%s';
		}
		if (array_key_exists('hours', $data)) {
			$fields['hours'] = $data['hours'] !== null ? (float) $data['hours'] : null;
			$formats[]       = '%f';
		}
		if (isset($data['external_id'])) {
			$fields['external_id'] = sanitize_text_field((string) $data['external_id']);
			$formats[]             = '%s';
		}
		if (empty($fields)) {
			return $this->get_by_id($id);
		}
		$updated = $wpdb->update(self::table_name(), $fields, array( 'id' => $id ), $formats, array( '%d' ));
		if ($updated === false) {
			return null;
		}
		return $this->get_by_id($id);
	}

	/**
	 * @param int $id Entry ID.
	 * @return bool
	 */
	public function delete(int $id): bool {
		global $wpdb;
		$deleted = $wpdb->delete(self::table_name(), array( 'id' => $id ), array( '%d' ));
		return (bool) $deleted;
	}
}
