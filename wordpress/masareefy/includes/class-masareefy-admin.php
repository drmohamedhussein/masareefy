<?php
/**
 * Admin menu and RTL placeholder UI.
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
	}

	/**
	 * Add the admin menu page.
	 */
	public static function register_menu(): void {
		self::$page_hook = add_menu_page(
			__('مصاريفي', 'masareefy'),
			__('مصاريفي', 'masareefy'),
			'read',
			'masareefy',
			array( self::class, 'render_page' ),
			'dashicons-money-alt',
			58
		);
	}

	/**
	 * Enqueue RTL admin placeholder assets.
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
				'restUrl' => rest_url('masareefy/v1/expenses'),
				'nonce'   => wp_create_nonce('wp_rest'),
			)
		);
	}

	/**
	 * Render the admin placeholder page.
	 */
	public static function render_page(): void {
		if (! current_user_can('read')) {
			wp_die(esc_html__('You do not have permission to access this page.', 'masareefy'));
		}

		?>
		<div class="wrap masareefy-admin" dir="rtl" lang="ar">
			<h1><?php echo esc_html__('مصاريفي', 'masareefy'); ?></h1>
			<div class="masareefy-admin__card">
				<p class="masareefy-admin__lead">
					<?php echo esc_html__('مرحبًا بك في متتبع المصاريف الشخصي. واجهة الإدارة قيد التطوير.', 'masareefy'); ?>
				</p>
				<p class="masareefy-admin__meta">
					<?php
					echo esc_html(
						sprintf(
							/* translators: %d: current user ID */
							__('المصاريف المعروضة خاصة بالمستخدم رقم %d فقط.', 'masareefy'),
							get_current_user_id()
						)
					);
					?>
				</p>
				<button type="button" class="button button-primary masareefy-admin__cta">
					<?php echo esc_html__('استكشاف REST API', 'masareefy'); ?>
				</button>
				<pre class="masareefy-admin__status" aria-live="polite"></pre>
			</div>
		</div>
		<?php
	}
}
