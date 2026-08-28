<?php
/**
 * Admin menu and work log UI for site owners.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

/**
 * Registers the Masareefy admin page.
 */
class Masareefy_Admin {

	/**
	 * Admin page hook suffix.
	 *
	 * @var string
	 */
	private static $page_hook = '';

	/**
	 * Hook admin integration.
	 */
	public static function register(): void {
		add_action('admin_menu', array( self::class, 'register_menu' ));
		add_action('admin_enqueue_scripts', array( self::class, 'enqueue_assets' ));
		add_action('admin_post_masareefy_save_sync', array( self::class, 'handle_save_sync' ));
	}

	/**
	 * Add the admin menu page.
	 */
	public static function register_menu(): void {
		self::$page_hook = add_menu_page(
			__('Masareefy', 'masareefy'),
			__('Masareefy', 'masareefy'),
			'read',
			'masareefy',
			array( self::class, 'render_page' ),
			'dashicons-clipboard',
			58
		);
	}

	/**
	 * Enqueue admin assets.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public static function enqueue_assets(string $hook): void {
		if ($hook !== self::$page_hook) {
			return;
		}

		wp_enqueue_style(
			'masareefy-admin',
			MASAREEFY_PLUGIN_URL . 'assets/css/admin.css',
			array(),
			MASAREEFY_VERSION
		);

		wp_enqueue_script(
			'masareefy-admin',
			MASAREEFY_PLUGIN_URL . 'assets/js/admin.js',
			array(),
			MASAREEFY_VERSION,
			true
		);

		wp_localize_script(
			'masareefy-admin',
			'masareefyAdmin',
			array(
				'restUrl'   => rest_url('masareefy/v1/'),
				'nonce'     => wp_create_nonce('wp_rest'),
				'canManage' => current_user_can('manage_options') || current_user_can('edit_posts'),
				'i18n'      => array(
					'workLog'      => __( 'Work log', 'masareefy' ),
					'title'        => __( 'Title', 'masareefy' ),
					'description'  => __( 'Description', 'masareefy' ),
					'status'       => __( 'Status', 'masareefy' ),
					'date'         => __( 'Date', 'masareefy' ),
					'hours'        => __( 'Hours', 'masareefy' ),
					'add'          => __( 'Add entry', 'masareefy' ),
					'syncNotion'   => __( 'Import from Notion', 'masareefy' ),
					'syncGoogle'   => __( 'Push to Google Sheets', 'masareefy' ),
					'loading'      => __( 'Loading…', 'masareefy' ),
					'saved'        => __( 'Saved', 'masareefy' ),
					'error'        => __( 'Something went wrong', 'masareefy' ),
				),
			)
		);
	}

	/**
	 * Save sync settings from admin form.
	 */
	public static function handle_save_sync(): void {
		if (! current_user_can('manage_options')) {
			wp_die(esc_html__('You do not have permission.', 'masareefy'));
		}

		check_admin_referer('masareefy_save_sync');

		Masareefy_Sync::save_settings(
			array(
				'notion_token'        => isset($_POST['notion_token']) ? wp_unslash((string) $_POST['notion_token']) : '',
				'notion_database'     => isset($_POST['notion_database']) ? wp_unslash((string) $_POST['notion_database']) : '',
				'google_sheet_id'     => isset($_POST['google_sheet_id']) ? wp_unslash((string) $_POST['google_sheet_id']) : '',
				'google_access_token' => isset($_POST['google_access_token']) ? wp_unslash((string) $_POST['google_access_token']) : '',
			)
		);

		wp_safe_redirect(
			add_query_arg(
				array(
					'page'    => 'masareefy',
					'saved'   => '1',
				),
				admin_url('admin.php')
			)
		);
		exit;
	}

	/**
	 * Render admin page.
	 */
	public static function render_page(): void {
		if (! current_user_can('read')) {
			wp_die(esc_html__('You do not have permission to access this page.', 'masareefy'));
		}

		$settings = Masareefy_Sync::get_settings();
		$can_manage = current_user_can('manage_options') || current_user_can('edit_posts');

		?>
		<div class="wrap masareefy-admin" dir="ltr" lang="en">
			<h1><?php echo esc_html__('Masareefy — Work log', 'masareefy'); ?></h1>
			<p class="masareefy-admin__lead">
				<?php echo esc_html__('Track work done on this site. Site owners can review every task without waiting for updates from the freelancer.', 'masareefy'); ?>
			</p>

			<?php if (isset($_GET['saved'])) : ?>
				<div class="notice notice-success is-dismissible"><p><?php esc_html_e('Sync settings saved.', 'masareefy'); ?></p></div>
			<?php endif; ?>

			<div class="masareefy-admin__grid">
				<section class="masareefy-admin__card masareefy-admin__card--wide">
					<h2><?php esc_html_e('Work entries', 'masareefy'); ?></h2>
					<div id="masareefy-work-log-list" class="masareefy-admin__table-wrap" aria-live="polite"></div>

					<?php if ($can_manage) : ?>
						<form id="masareefy-work-log-form" class="masareefy-admin__form">
							<h3><?php esc_html_e('Add work entry', 'masareefy'); ?></h3>
							<p>
								<label>
									<?php esc_html_e('Title', 'masareefy'); ?>
									<input type="text" name="title" required class="regular-text" />
								</label>
							</p>
							<p>
								<label>
									<?php esc_html_e('Description', 'masareefy'); ?>
									<textarea name="description" rows="3" class="large-text"></textarea>
								</label>
							</p>
							<p class="masareefy-admin__row">
								<label>
									<?php esc_html_e('Date', 'masareefy'); ?>
									<input type="date" name="worked_on" value="<?php echo esc_attr(gmdate('Y-m-d')); ?>" />
								</label>
								<label>
									<?php esc_html_e('Hours', 'masareefy'); ?>
									<input type="number" name="hours" min="0" step="0.25" />
								</label>
								<label>
									<?php esc_html_e('Status', 'masareefy'); ?>
									<select name="status">
										<option value="done"><?php esc_html_e('Done', 'masareefy'); ?></option>
										<option value="in_progress"><?php esc_html_e('In progress', 'masareefy'); ?></option>
										<option value="planned"><?php esc_html_e('Planned', 'masareefy'); ?></option>
									</select>
								</label>
							</p>
							<p>
								<button type="submit" class="button button-primary"><?php esc_html_e('Save entry', 'masareefy'); ?></button>
								<button type="button" class="button" id="masareefy-sync-notion"><?php esc_html_e('Import from Notion', 'masareefy'); ?></button>
								<button type="button" class="button" id="masareefy-sync-google"><?php esc_html_e('Push to Google Sheets', 'masareefy'); ?></button>
							</p>
						</form>
					<?php endif; ?>
				</section>

				<?php if (current_user_can('manage_options')) : ?>
					<section class="masareefy-admin__card">
						<h2><?php esc_html_e('Sync settings', 'masareefy'); ?></h2>
						<p class="description"><?php esc_html_e('Connect Notion or Google Sheets for two-way updates. Credentials are stored only on this site.', 'masareefy'); ?></p>
						<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
							<?php wp_nonce_field('masareefy_save_sync'); ?>
							<input type="hidden" name="action" value="masareefy_save_sync" />
							<p>
								<label><?php esc_html_e('Notion token', 'masareefy'); ?>
									<input type="password" name="notion_token" class="large-text" value="<?php echo esc_attr($settings['notion_token']); ?>" autocomplete="off" />
								</label>
							</p>
							<p>
								<label><?php esc_html_e('Notion database ID', 'masareefy'); ?>
									<input type="text" name="notion_database" class="large-text" value="<?php echo esc_attr($settings['notion_database']); ?>" />
								</label>
							</p>
							<p>
								<label><?php esc_html_e('Google Sheet ID', 'masareefy'); ?>
									<input type="text" name="google_sheet_id" class="large-text" value="<?php echo esc_attr($settings['google_sheet_id']); ?>" />
								</label>
							</p>
							<p>
								<label><?php esc_html_e('Google access token', 'masareefy'); ?>
									<input type="password" name="google_access_token" class="large-text" value="<?php echo esc_attr($settings['google_access_token']); ?>" autocomplete="off" />
								</label>
							</p>
							<p><button type="submit" class="button button-primary"><?php esc_html_e('Save sync settings', 'masareefy'); ?></button></p>
						</form>
					</section>
				<?php endif; ?>
			</div>
		</div>
		<?php
	}
}
