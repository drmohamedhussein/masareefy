<?php
/**
 * REST API routes for Masareefy expenses.
 *
 * @package Masareefy
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

/**
 * Registers /masareefy/v1/expenses routes.
 */
class Masareefy_REST {

	/**
	 * Hook REST route registration.
	 */
	public static function register(): void {
		add_action('rest_api_init', array( self::class, 'register_routes' ));
	}

	/**
	 * Require a logged-in user with read capability.
	 *
	 * @return bool
	 */
	public static function permission_check(): bool {
		return is_user_logged_in() && current_user_can('read');
	}

	/**
	 * Register expense routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			'masareefy/v1',
			'/expenses',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'list_expenses' ),
					'permission_callback' => array( self::class, 'permission_check' ),
					'args'                => array(
						'from' => array(
							'type'              => 'string',
							'format'            => 'date',
							'sanitize_callback' => 'sanitize_text_field',
						),
						'to'   => array(
							'type'              => 'string',
							'format'            => 'date',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'create_expense' ),
					'permission_callback' => array( self::class, 'permission_check' ),
				),
			)
		);

		register_rest_route(
			'masareefy/v1',
			'/expenses/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_expense' ),
					'permission_callback' => array( self::class, 'permission_check' ),
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( self::class, 'update_expense' ),
					'permission_callback' => array( self::class, 'permission_check' ),
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( self::class, 'delete_expense' ),
					'permission_callback' => array( self::class, 'permission_check' ),
					'args'                => array(
						'id' => array(
							'type'              => 'integer',
							'required'          => true,
							'sanitize_callback' => 'absint',
						),
					),
				),
			)
		);
	}

	/**
	 * GET /expenses
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function list_expenses(WP_REST_Request $request) {
		$repo = new Masareefy_Repository();

		return rest_ensure_response(
			$repo->get_all(
				$request->get_param('from'),
				$request->get_param('to')
			)
		);
	}

	/**
	 * POST /expenses
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function create_expense(WP_REST_Request $request) {
		$repo    = new Masareefy_Repository();
		$expense = $repo->create($request->get_json_params() ?? array());

		if ($expense === null) {
			return new WP_Error(
				'masareefy_create_failed',
				__('Could not create expense.', 'masareefy'),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response($expense);
	}

	/**
	 * GET /expenses/{id}
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_expense(WP_REST_Request $request) {
		$repo    = new Masareefy_Repository();
		$expense = $repo->get_by_id((int) $request->get_param('id'));

		if ($expense === null) {
			return new WP_Error(
				'masareefy_not_found',
				__('Expense not found.', 'masareefy'),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response($expense);
	}

	/**
	 * PUT/PATCH /expenses/{id}
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function update_expense(WP_REST_Request $request) {
		$id      = (int) $request->get_param('id');
		$repo    = new Masareefy_Repository();
		$expense = $repo->update($id, $request->get_json_params() ?? array());

		if ($expense === null) {
			return new WP_Error(
				'masareefy_update_failed',
				__('Expense not found or could not be updated.', 'masareefy'),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response($expense);
	}

	/**
	 * DELETE /expenses/{id}
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_expense(WP_REST_Request $request) {
		$id     = (int) $request->get_param('id');
		$repo   = new Masareefy_Repository();
		$delete = $repo->delete($id);

		if (! $delete) {
			return new WP_Error(
				'masareefy_delete_failed',
				__('Expense not found or could not be deleted.', 'masareefy'),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response(
			array(
				'deleted' => true,
				'id'      => $id,
			)
		);
	}
}
