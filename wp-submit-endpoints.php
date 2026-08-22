<?php
/**
 * Plugin Name: Denshattack Submit Endpoints
 * Description: Public REST endpoints for the "Add a skip / sticker" forms.
 *
 * Everything lands as a `pending` post; nothing goes live until you
 * approve it in wp-admin.
 *
 * Sticker images are real uploads (multipart/form-data), handled with the
 * same core functions WordPress itself uses for the media library
 * (wp_handle_upload, wp_check_filetype_and_ext), the safest way to accept
 * a file from an anonymous public form.
 *
 * NOTE: the post type keys are "skip" / "sticker" / "technique" (singular).
 * That's the real WordPress post_type slug registered by ACF, distinct from
 * the plural "skips"/"stickers"/"techniques" GraphQL type name used in
 * queries.
 */

// --- CORS: the static site lives on a different domain than this WP install ---
add_action( 'rest_api_init', function () {
	remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
	add_filter( 'rest_pre_serve_request', function ( $value ) {
		// Replace with your real front-end origin(s) once you know the final domain.
		header( 'Access-Control-Allow-Origin: *' );
		header( 'Access-Control-Allow-Methods: POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type' );
		return $value;
	} );
}, 15 );

// --- Very small per-IP rate limit: 5 submissions / hour per endpoint ---
function densha_rate_limit_ok( $key ) {
	// Dev bypass: fetch() from the local Astro dev server sends this Origin
	// header, so testing repeatedly from localhost:4321 never gets capped.
	// REMOVE THIS BLOCK once the site is live on its real domain, since anyone
	// could spoof this header to skip the limit entirely otherwise.
	$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
	if ( strpos( $origin, 'http://localhost:' ) === 0 ) {
		return true;
	}

	$ip    = sanitize_text_field( $_SERVER['REMOTE_ADDR'] ?? 'unknown' );
	$tkey  = "densha_rl_{$key}_" . md5( $ip );
	$count = (int) get_transient( $tkey );

	if ( $count >= 5 ) {
		return false;
	}

	set_transient( $tkey, $count + 1, HOUR_IN_SECONDS );
	return true;
}

// --- Reject if the honeypot field is filled (real visitors never see it) ---
function densha_honeypot_tripped( $data ) {
	return ! empty( $data['website'] );
}

// --- Image upload, restricted to a tight image whitelist -----------------

define( 'DENSHA_MAX_UPLOAD_BYTES', 5 * 1024 * 1024 ); // 5MB

function densha_allowed_image_mimes() {
	return array(
		'jpg|jpeg' => 'image/jpeg',
		'png'      => 'image/png',
		'webp'     => 'image/webp',
		'gif'      => 'image/gif',
	);
}

/**
 * Turns one $_FILES-style entry into a real media library attachment,
 * returning the attachment ID (or null if nothing was submitted, or a
 * WP_Error if the file was rejected).
 *
 * wp_check_filetype_and_ext() inspects the file's actual content, not just
 * its name/extension, so a renamed script can't sneak through disguised as
 * "photo.jpg", the same check WordPress runs on every native upload.
 */
function densha_handle_image_upload( $file, $post_id, $meta = array() ) {
	if ( empty( $file ) || empty( $file['tmp_name'] ) ) {
		return null; // optional field, nothing submitted
	}

	if ( $file['error'] !== UPLOAD_ERR_OK ) {
		return new WP_Error( 'upload_error', 'File upload failed.', array( 'status' => 400 ) );
	}

	if ( $file['size'] > DENSHA_MAX_UPLOAD_BYTES ) {
		return new WP_Error( 'file_too_large', 'File is too large (max 5MB).', array( 'status' => 400 ) );
	}

	$allowed = densha_allowed_image_mimes();
	$checked = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'], $allowed );
	if ( empty( $checked['ext'] ) || empty( $checked['type'] ) ) {
		return new WP_Error( 'invalid_file_type', 'Only JPG, PNG, WEBP or GIF images are allowed.', array( 'status' => 400 ) );
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	// Restrict wp_handle_upload() to the same whitelist for this one call.
	$restrict_mimes = function () use ( $allowed ) {
		return $allowed;
	};
	add_filter( 'upload_mimes', $restrict_mimes );
	$moved = wp_handle_upload( $file, array( 'test_form' => false ) );
	remove_filter( 'upload_mimes', $restrict_mimes );

	if ( isset( $moved['error'] ) ) {
		return new WP_Error( 'upload_failed', $moved['error'], array( 'status' => 400 ) );
	}

	$attachment_id = wp_insert_attachment( array(
		'post_mime_type' => $moved['type'],
		'post_title'      => $meta['title'] ?? sanitize_file_name( $file['name'] ),
		'post_excerpt'    => $meta['caption'] ?? '', // "Caption" field in the media library
		'post_status'     => 'inherit', // standard status for attachments
		'post_parent'     => $post_id,
	), $moved['file'] );

	if ( is_wp_error( $attachment_id ) ) {
		return $attachment_id;
	}

	if ( ! empty( $meta['alt'] ) ) {
		update_post_meta( $attachment_id, '_wp_attachment_image_alt', $meta['alt'] );
	}

	$metadata = wp_generate_attachment_metadata( $attachment_id, $moved['file'] );
	wp_update_attachment_metadata( $attachment_id, $metadata );

	return $attachment_id;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'denshattack/v1', '/submit-skip', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true', // public, anonymous submissions
		'callback'            => function ( WP_REST_Request $req ) {
			$data = $req->get_params();

			if ( densha_honeypot_tripped( $data ) ) {
				// Pretend it worked so the bot doesn't learn to skip the field.
				return new WP_REST_Response( array( 'ok' => true ), 200 );
			}

			if ( ! densha_rate_limit_ok( 'skip' ) ) {
				return new WP_Error( 'rate_limited', 'Too many submissions, try again later.', array( 'status' => 429 ) );
			}

			$name = sanitize_text_field( $data['name'] ?? '' );
			if ( $name === '' ) {
				return new WP_Error( 'missing_name', 'Name is required.', array( 'status' => 400 ) );
			}

			$level = sanitize_text_field( $data['level'] ?? '' );

			// Levels are submitted as "1-2-1 Adventure Awaits!" (code + full
			// name) but the post title only wants the leading code, e.g.
			// "1-2-1 Skip Name", matching the existing wp-admin convention.
			preg_match( '/^\S+/', $level, $level_code_match );
			$level_code = $level_code_match[0] ?? '';

			$post_id = wp_insert_post( array(
				'post_type'   => 'skip', // real post_type key registered by ACF (singular)
				'post_status' => 'pending', // awaits review, not public until approved
				'post_title'  => trim( $level_code . ' ' . $name ),
			), true );

			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}

			update_field( 'name', $name, $post_id );
			update_field( 'level', $level, $post_id );
			update_field( 'difficulty', sanitize_text_field( $data['difficulty'] ?? '' ), $post_id );
			update_field( 'timesave', (int) ( $data['timesave'] ?? 0 ), $post_id );
			// NOTE: ACF's actual field name (the "Field Name" in wp-admin, used as the
			// meta key) appears to be snake_case here even though WPGraphQL exposes it
			// as camelCase for reads, the same mismatch as the post_type slug earlier.
			// If these two still don't save, check Custom Fields > skipData in
			// wp-admin for the real field name and tell me what it says.
			update_field( 'youtube_link', esc_url_raw( $data['youtubeLink'] ?? '' ), $post_id );
			update_field( 'found_by', sanitize_text_field( $data['foundBy'] ?? '' ), $post_id );
			update_field( 'description', sanitize_textarea_field( $data['description'] ?? '' ), $post_id );

			return new WP_REST_Response( array( 'ok' => true ), 200 );
		},
	) );

	register_rest_route( 'denshattack/v1', '/submit-sticker', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => function ( WP_REST_Request $req ) {
			$data = $req->get_params(); // text fields, works for multipart too

			if ( densha_honeypot_tripped( $data ) ) {
				return new WP_REST_Response( array( 'ok' => true ), 200 );
			}

			if ( ! densha_rate_limit_ok( 'sticker' ) ) {
				return new WP_Error( 'rate_limited', 'Too many submissions, try again later.', array( 'status' => 429 ) );
			}

			$name = sanitize_text_field( $data['name'] ?? '' );
			if ( $name === '' ) {
				return new WP_Error( 'missing_name', 'Name is required.', array( 'status' => 400 ) );
			}

			$post_id = wp_insert_post( array(
				'post_type'   => 'sticker', // real post_type key registered by ACF (singular)
				'post_status' => 'pending',
				'post_title'  => $name,
			), true );

			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}

			$artist = sanitize_text_field( $data['artist'] ?? '' );

			// The form collects tags comma-separated ("meme, harambe"), but ACF
			// stores them as one space-separated string with no commas, so split
			// on either, then rejoin with spaces.
			$tags     = array_filter( array_map( 'trim', preg_split( '/[,\s]+/', $data['tags'] ?? '' ) ) );
			$tags_str = implode( ' ', $tags );

			update_field( 'name', $name, $post_id );
			update_field( 'artist', $artist, $post_id );
			update_field( 'tags', $tags_str, $post_id );

			$by = $artist ? " by {$artist}" : '';

			$files = $req->get_file_params();

			$sticker_id = densha_handle_image_upload( $files['stickerImage'] ?? null, $post_id, array(
				'title'   => $name,
				'alt'     => "{$name} sticker{$by}",
				'caption' => trim( ( $artist ? "By {$artist}." : '' ) . ( $tags_str ? " Tags: {$tags_str}" : '' ) ),
			) );
			if ( is_wp_error( $sticker_id ) ) {
				wp_delete_post( $post_id, true ); // don't leave a half-created submission around
				return $sticker_id;
			}
			if ( $sticker_id ) {
				// ACF field name is snake_case ("sticker_image") even though the
				// upload's own form-field key ($files['stickerImage'] above) is
				// camelCase; those are two different, unrelated names.
				update_field( 'sticker_image', $sticker_id, $post_id );
			}

			$screenshot_id = densha_handle_image_upload( $files['screenshot'] ?? null, $post_id, array(
				'title'   => "{$name}: in-game screenshot",
				'alt'     => "{$name} sticker shown in-game{$by}",
				'caption' => "In-game screenshot of the {$name} sticker" . ( $artist ? " by {$artist}" : '' ) . '.',
			) );
			if ( is_wp_error( $screenshot_id ) ) {
				wp_delete_post( $post_id, true );
				return $screenshot_id;
			}
			if ( $screenshot_id ) {
				update_field( 'screenshot', $screenshot_id, $post_id );
			}

			return new WP_REST_Response( array( 'ok' => true ), 200 );
		},
	) );

	register_rest_route( 'denshattack/v1', '/submit-technique', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true', // public, anonymous submissions
		'callback'            => function ( WP_REST_Request $req ) {
			$data = $req->get_params();

			if ( densha_honeypot_tripped( $data ) ) {
				// Pretend it worked so the bot doesn't learn to skip the field.
				return new WP_REST_Response( array( 'ok' => true ), 200 );
			}

			if ( ! densha_rate_limit_ok( 'technique' ) ) {
				return new WP_Error( 'rate_limited', 'Too many submissions, try again later.', array( 'status' => 429 ) );
			}

			$name = sanitize_text_field( $data['name'] ?? '' );
			if ( $name === '' ) {
				return new WP_Error( 'missing_name', 'Name is required.', array( 'status' => 400 ) );
			}

			$post_id = wp_insert_post( array(
				'post_type'   => 'technique', // real post_type key registered by ACF (singular)
				'post_status' => 'pending', // awaits review, not public until approved
				'post_title'  => $name,
			), true );

			if ( is_wp_error( $post_id ) ) {
				return $post_id;
			}

			update_field( 'name', $name, $post_id );
			// NOTE: ACF's actual field name (the "Field Name" in wp-admin, used as the
			// meta key) may be snake_case here even though WPGraphQL exposes it as
			// camelCase for reads, same as the skip/sticker fields above. If this
			// doesn't save, check Custom Fields > techniqueData in wp-admin for the
			// real field name.
			update_field( 'youtube_link', esc_url_raw( $data['youtubeLink'] ?? '' ), $post_id );
			update_field( 'description', sanitize_textarea_field( $data['description'] ?? '' ), $post_id );

			// "Variant of" is submitted as the parent technique's post ID (the
			// submission form's dropdown carries the ID as its value, the
			// technique's name as its visible label).
			$variant_of_id = (int) ( $data['variantOf'] ?? 0 );
			if ( $variant_of_id > 0 && get_post_type( $variant_of_id ) === 'technique' ) {
				update_field( 'variant_of', $variant_of_id, $post_id );
			}

			return new WP_REST_Response( array( 'ok' => true ), 200 );
		},
	) );
} );
