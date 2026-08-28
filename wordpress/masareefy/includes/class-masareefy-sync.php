<?php
/**
 * External sync — Notion and Google Sheets for work log.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

/**
 * Sync work log entries with Notion and Google Sheets.
 */
class Masareefy_Sync {

	private const OPTION_KEY = 'masareefy_sync_settings';

	/**
	 * @return array<string,string>
	 */
	public static function get_settings(): array {
		$stored = get_option(self::OPTION_KEY, array());
		if (! is_array($stored)) {
			return array();
		}
		return array(
			'notion_token'      => sanitize_text_field((string) ($stored['notion_token'] ?? '')),
			'notion_database'   => sanitize_text_field((string) ($stored['notion_database'] ?? '')),
			'google_sheet_id'   => sanitize_text_field((string) ($stored['google_sheet_id'] ?? '')),
			'google_access_token' => sanitize_text_field((string) ($stored['google_access_token'] ?? '')),
		);
	}

	/**
	 * @param array<string,string> $settings Settings.
	 */
	public static function save_settings(array $settings): void {
		update_option(
			self::OPTION_KEY,
			array(
				'notion_token'        => sanitize_text_field($settings['notion_token'] ?? ''),
				'notion_database'     => sanitize_text_field($settings['notion_database'] ?? ''),
				'google_sheet_id'     => sanitize_text_field($settings['google_sheet_id'] ?? ''),
				'google_access_token' => sanitize_text_field($settings['google_access_token'] ?? ''),
			),
			false
		);
	}

	/**
	 * Push one work log row to Notion.
	 *
	 * @param array<string,mixed> $entry Entry.
	 * @return bool
	 */
	public static function push_to_notion(array $entry): bool {
		$settings = self::get_settings();
		if ($settings['notion_token'] === '' || $settings['notion_database'] === '') {
			return false;
		}

		$body = array(
			'parent'     => array( 'database_id' => $settings['notion_database'] ),
			'properties' => array(
				'Title'       => array(
					'title' => array(
						array(
							'text' => array(
								'content' => (string) $entry['title'],
							),
						),
					),
				),
				'Status'      => array(
					'select' => array( 'name' => (string) $entry['status'] ),
				),
				'WorkedOn'    => array(
					'date' => array( 'start' => (string) $entry['worked_on'] ),
				),
				'Description' => array(
					'rich_text' => array(
						array(
							'text' => array(
								'content' => (string) ($entry['description'] ?? ''),
							),
						),
					),
				),
				'ExternalId'  => array(
					'rich_text' => array(
						array(
							'text' => array(
								'content' => (string) ($entry['id'] ?? ''),
							),
						),
					),
				),
			),
		);

		if (isset($entry['hours']) && $entry['hours'] !== null) {
			$body['properties']['Hours'] = array(
				'number' => (float) $entry['hours'],
			);
		}

		$response = wp_remote_post(
			'https://api.notion.com/v1/pages',
			array(
				'headers' => array(
					'Authorization'  => 'Bearer ' . $settings['notion_token'],
					'Notion-Version' => '2022-06-28',
					'Content-Type'   => 'application/json',
				),
				'body'    => wp_json_encode($body),
				'timeout' => 20,
			)
		);

		return ! is_wp_error($response) && wp_remote_retrieve_response_code($response) < 300;
	}

	/**
	 * Pull work log entries from Notion database query.
	 *
	 * @return array<int,array<string,mixed>>
	 */
	public static function pull_from_notion(): array {
		$settings = self::get_settings();
		if ($settings['notion_token'] === '' || $settings['notion_database'] === '') {
			return array();
		}

		$response = wp_remote_post(
			'https://api.notion.com/v1/databases/' . rawurlencode($settings['notion_database']) . '/query',
			array(
				'headers' => array(
					'Authorization'  => 'Bearer ' . $settings['notion_token'],
					'Notion-Version' => '2022-06-28',
					'Content-Type'   => 'application/json',
				),
				'body'    => wp_json_encode(array( 'page_size' => 100 )),
				'timeout' => 20,
			)
		);

		if (is_wp_error($response)) {
			return array();
		}

		$data = json_decode(wp_remote_retrieve_body($response), true);
		if (! is_array($data) || ! isset($data['results']) || ! is_array($data['results'])) {
			return array();
		}

		$repo    = new Masareefy_Work_Log_Repository();
		$imported = array();

		foreach ($data['results'] as $page) {
			if (! is_array($page)) {
				continue;
			}
			$props = $page['properties'] ?? array();
			$title = self::notion_title($props);
			if ($title === '') {
				continue;
			}
			$external = $page['id'] ?? null;
			$entry    = $repo->create(
				array(
					'title'       => $title,
					'description' => self::notion_rich_text($props, 'Description'),
					'status'      => self::notion_select($props, 'Status', 'done'),
					'worked_on'   => self::notion_date($props, 'WorkedOn'),
					'hours'       => self::notion_number($props, 'Hours'),
					'external_id' => is_string($external) ? $external : null,
					'source'      => 'notion',
				)
			);
			if ($entry !== null) {
				$imported[] = $entry;
			}
		}

		return $imported;
	}

	/**
	 * Append work log rows to Google Sheets.
	 *
	 * @param array<int,array<string,mixed>> $entries Entries.
	 * @return bool
	 */
	public static function push_to_google(array $entries): bool {
		$settings = self::get_settings();
		if ($settings['google_sheet_id'] === '' || $settings['google_access_token'] === '') {
			return false;
		}

		$values = array();
		foreach ($entries as $entry) {
			$values[] = array(
				(string) ($entry['worked_on'] ?? ''),
				(string) ($entry['title'] ?? ''),
				(string) ($entry['description'] ?? ''),
				(string) ($entry['status'] ?? ''),
				(string) ($entry['hours'] ?? ''),
				(string) ($entry['id'] ?? ''),
			);
		}

		if ($values === array()) {
			return true;
		}

		$url = sprintf(
			'https://sheets.googleapis.com/v4/spreadsheets/%s/values/WorkLog!A:F:append?valueInputOption=USER_ENTERED',
			rawurlencode($settings['google_sheet_id'])
		);

		$response = wp_remote_post(
			$url,
			array(
				'headers' => array(
					'Authorization' => 'Bearer ' . $settings['google_access_token'],
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(array( 'values' => $values )),
				'timeout' => 20,
			)
		);

		return ! is_wp_error($response) && wp_remote_retrieve_response_code($response) < 300;
	}

	/**
	 * @param array<string,mixed> $props Notion properties.
	 * @return string
	 */
	private static function notion_title(array $props): string {
		$title_prop = $props['Title'] ?? $props['Name'] ?? null;
		if (! is_array($title_prop) || ! isset($title_prop['title'][0]['plain_text'])) {
			return '';
		}
		return (string) $title_prop['title'][0]['plain_text'];
	}

	/**
	 * @param array<string,mixed> $props Properties.
	 * @param string              $key   Key.
	 * @return string
	 */
	private static function notion_rich_text(array $props, string $key): string {
		$prop = $props[ $key ] ?? null;
		if (! is_array($prop) || ! isset($prop['rich_text'][0]['plain_text'])) {
			return '';
		}
		return (string) $prop['rich_text'][0]['plain_text'];
	}

	/**
	 * @param array<string,mixed> $props Properties.
	 * @param string              $key   Key.
	 * @param string              $fallback Fallback.
	 * @return string
	 */
	private static function notion_select(array $props, string $key, string $fallback): string {
		$prop = $props[ $key ] ?? null;
		if (! is_array($prop) || ! isset($prop['select']['name'])) {
			return $fallback;
		}
		return sanitize_key((string) $prop['select']['name']);
	}

	/**
	 * @param array<string,mixed> $props Properties.
	 * @param string              $key   Key.
	 * @return string
	 */
	private static function notion_date(array $props, string $key): string {
		$prop = $props[ $key ] ?? $props['Date'] ?? null;
		if (! is_array($prop) || ! isset($prop['date']['start'])) {
			return gmdate('Y-m-d');
		}
		return sanitize_text_field((string) $prop['date']['start']);
	}

	/**
	 * @param array<string,mixed> $props Properties.
	 * @param string              $key   Key.
	 * @return float|null
	 */
	private static function notion_number(array $props, string $key): ?float {
		$prop = $props[ $key ] ?? null;
		if (! is_array($prop) || ! isset($prop['number'])) {
			return null;
		}
		return (float) $prop['number'];
	}
}
