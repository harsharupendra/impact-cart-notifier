<?php
/**
 * Plugin Name: Impact Cart Notifier
 * Plugin URI:  https://impact.com
 * Description: Notifies the user when a WooCommerce cart item quantity changes.
 * Author:      Harsha
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Impact_Cart_Notifier {

    public function __construct() {
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
    }

    public function enqueue_scripts() {

        wp_enqueue_script(
            'impact-cart-notifier',
            plugin_dir_url( __FILE__ ) . 'impact-cart-notifier.js',
            array( 'jquery' ),
            filemtime( plugin_dir_path( __FILE__ ) . 'impact-cart-notifier.js' ),
            true
        );

        // Build a map of cart item key → SKU & name to pass to JS
        $cart_items = array();

        if ( function_exists( 'WC' ) && WC()->cart ) {
            foreach ( WC()->cart->get_cart() as $cart_item_key => $cart_item ) {
                $product = $cart_item['data'];
                $cart_items[ $cart_item_key ] = array(
                    'sku'      => $product->get_sku(),
                    'name'     => $product->get_name(),
                    'quantity' => $cart_item['quantity'],
                );
            }
        }

        wp_localize_script(
            'impact-cart-notifier',
            'impactCartData',
            array(
                'cartItems' => $cart_items,
            )
        );
    }
}

new Impact_Cart_Notifier();
