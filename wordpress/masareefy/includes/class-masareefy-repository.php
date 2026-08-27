<?php
/**
 * Expense repository scoped to the current user.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

/**
 * CRUD operations for wp_masareefy_expenses.
 */
class Masareefy_Repository {

	/**
	 * WordPress database object.
	 *
	 * @var wpdb
	 */
	private $wpdb;

	/**
	 * Fully qualified table name.
	 *
	 * @var string
	 */
	private $table;

	/**
	 * Constructor.
	 */
	public function __construct() {
		global $wpdb;

		$this->wpdb  = $wpdb;
		$this->table = $wpdb->prefix . 'masareefy_expenses';
	}

	/**
	 * List expenses for the current user.
	 *
	 * @param string|null $from Optional start date (Y-m-d).
	 * @param string|null $to   Optional end date (Y-m-d).
	 * @return array<int, array<string, mixed>>
	 */
	public function get_all(?string $from = null, ?string $to = null): array {
		$user_id = get_current_user_id();

		if ($user_id === 0) {
			return array();
		}

		$where  = 'user_id = %d';
		$params = array( $user_id );

		if ($from !== null) {
			$where   .= ' AND spent_on >= %s';
			$params[] = $from;
		}

		if ($to !== null) {
			$where   .= ' AND spent_on <= %s';
			$params[] = $to;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is trusted.
		$sql  = $this->wpdb->prepare(
			"SELECT * FROM {$this->table} WHERE {$where} ORDER BY spent_on DESC, id DESC",
			...$params
		);
		$rows = $this->wpdb->get_results($sql, ARRAY_A);

		if (! is_array($rows)) {
			return array();
		}

		return array_map(array( $this, 'format_row' ), $rows);
	}

	/**
	 * Fetch a single expense owned by the current user.
	 *
	 * @param int $id Expense ID.
	 * @return array<string, mixed>|null
	 */
	public function get_by_id(int $id): ?array {
		$user_id = get_current_user_id();

		if ($user_id === 0) {
			return null;
		}

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name is trusted.
		$sql = $this->wpdb->prepare(
			"SELECT * FROM {$this->table} WHERE id = %d AND user_id = %d",
			$id,
			$user_id
		);

		$row = $this->wpdb->get_row($sql, ARRAY_A);

		return is_array($row) ? $this->format_row($row) : null;
	}

	/**
	 * Create an expense for the current user.
	 *
	 * @param array<string, mixed> $data Expense payload.
	 * @return array<string, mixed>|null
	 */
	public function create(array $data): ?array {
		$user_id = get_current_user_id();

		if ($user_id === 0) {
			return null;
		}

		$now    = current_time('mysql');
		$insert = array(
			'user_id'    => $user_id,
			'amount'     => $this->normalize_amount($data),
			'item_name'  => sanitize_text_field((string) ( $data['item_name'] ?? '' )),
			'tags'       => wp_json_encode($this->normalize_tags($data['tags'] ?? array())),
			'notes'      => sanitize_textarea_field((string) ( $data['notes'] ?? '' )),
			'spent_on'   => sanitize_text_field((string) ( $data['spent_on'] ?? current_time('Y-m-d') )),
			'created_at' => $now,
			'updated_at' => $now,
		);

		$result = $this->wpdb->insert(
			$this->table,
			$insert,
			array( '%d', '%f', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ($result === false) {
			return null;
		}

		return $this->get_by_id((int) $this->wpdb->insert_id);
	}

	/**
	 * Update an expense owned by the current user.
	 *
	 * @param int                  $id   Expense ID.
	 * @param array<string, mixed> $data Fields to update.
	 * @return array<string, mixed>|null
	 */
	public function update(int $id, array $data): ?array {
		$user_id = get_current_user_id();

		if ($user_id === 0 || $this->get_by_id($id) === null) {
			return null;
		}

		$update  = array(
			'updated_at' => current_time('mysql'),
		);
		$formats = array( '%s' );

		if (array_key_exists('amount', $data)) {
			$update['amount'] = $this->normalize_amount($data);
			$formats[]        = '%f';
		}

		if (isset($data['item_name'])) {
			$update['item_name'] = sanitize_text_field((string) $data['item_name']);
			$formats[]           = '%s';
		}

		if (isset($data['tags'])) {
			$update['tags'] = wp_json_encode($this->normalize_tags($data['tags']));
			$formats[]      = '%s';
		}

		if (isset($data['notes'])) {
			$update['notes'] = sanitize_textarea_field((string) $data['notes']);
			$formats[]       = '%s';
		}

		if (isset($data['spent_on'])) {
			$update['spent_on'] = sanitize_text_field((string) $data['spent_on']);
			$formats[]          = '%s';
		}

		$result = $this->wpdb->update(
			$this->table,
			$update,
			array(
				'id'      => $id,
				'user_id' => $user_id,
			),
			$formats,
			array( '%d', '%d' )
		);

		if ($result === false) {
			return null;
		}

		return $this->get_by_id($id);
	}

	/**
	 * Delete an expense owned by the current user.
	 *
	 * @param int $id Expense ID.
	 * @return bool
	 */
	public function delete(int $id): bool {
		$user_id = get_current_user_id();

		if ($user_id === 0) {
			return false;
		}

		$result = $this->wpdb->delete(
			$this->table,
			array(
				'id'      => $id,
				'user_id' => $user_id,
			),
			array( '%d', '%d' )
		);

		return $result !== false && $result > 0;
	}

	/**
	 * Normalize a database row for API output.
	 *
	 * @param array<string, mixed> $row Raw row.
	 * @return array<string, mixed>
	 */
	private function format_row(array $row): array {
		$tags = json_decode((string) ( $row['tags'] ?? '[]' ), true);

		return array(
			'id'         => (int) $row['id'],
			'user_id'    => (int) $row['user_id'],
			'amount'     => $row['amount'] !== null ? (float) $row['amount'] : null,
			'item_name'  => (string) $row['item_name'],
			'tags'       => is_array($tags) ? $tags : array(),
			'notes'      => (string) ( $row['notes'] ?? '' ),
			'spent_on'   => (string) $row['spent_on'],
			'created_at' => (string) $row['created_at'],
			'updated_at' => (string) $row['updated_at'],
		);
	}

	/**
	 * Normalize amount to float or null.
	 *
	 * @param array<string, mixed> $data Input data.
	 * @return float|null
	 */
	private function normalize_amount(array $data): ?float {
		if (! array_key_exists('amount', $data) || $data['amount'] === null || $data['amount'] === '') {
			return null;
		}

		return (float) $data['amount'];
	}

	/**
	 * Normalize tags to a string array.
	 *
	 * @param mixed $tags Raw tags value.
	 * @return array<int, string>
	 */
	private function normalize_tags($tags): array {
		if (! is_array($tags)) {
			return array();
		}

		return array_values(
			array_map(
				static function ($tag): string {
					return sanitize_text_field((string) $tag);
				},
				$tags
			)
		);
	}
}
