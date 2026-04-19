(function ($) {
    'use strict';

    var previousQuantities = {};
    var lastChangedKey = null;

    // Store current quantities on page load
    function initQuantities() {
        $('input[name^="cart["]').each(function () {
            var key = extractKey($(this).attr('name'));
            if (key) {
                previousQuantities[key] = parseInt($(this).val(), 10);
            }
        });
    }

    // Extract cart item key from input name e.g. cart[ABC123][qty]
    function extractKey(name) {
        var match = name.match(/cart\[([^\]]+)\]/);
        return match ? match[1] : null;
    }

    // Track which quantity input was touched most recently
    $(document).on('change', 'input[name^="cart["]', function () {
        lastChangedKey = extractKey($(this).attr('name'));
    });

    // This fires AFTER WooCommerce confirms the cart update via AJAX
    $(document.body).on('updated_cart_totals', function () {

        if ( ! lastChangedKey) {
            return;
        }

        var input = $('input[name="cart[' + lastChangedKey + '][qty]"]');
        if (input.length === 0) {
            console.error('Impact Cart Notifier: Could not find input for key', lastChangedKey);
            lastChangedKey = null;
            return;
        }

        if (typeof impactCartData === 'undefined') {
            console.error('Impact Cart Notifier: impactCartData not loaded, plugin may not be initialised correctly');
            return;
        }

        var newQty = parseInt(input.val(), 10);
        var oldQty = previousQuantities[lastChangedKey];

        // Only alert if quantity actually changed
        if (newQty !== oldQty) {
            var name = impactCartData.cartItems[lastChangedKey]
                ? impactCartData.cartItems[lastChangedKey].name
                : null;

            var message = name
                ? 'You just changed the quantity of ' + name + ' to ' + newQty
                : 'You just changed the quantity of this product to ' + newQty;

            alert(message);
        }

        // Refresh stored quantities after update
        $('input[name^="cart["]').each(function () {
            var key = extractKey($(this).attr('name'));
            if (key) {
                previousQuantities[key] = parseInt($(this).val(), 10);
            }
        });

        lastChangedKey = null;
    });

    $(document).ready(function () {
        initQuantities();
    });

})(jQuery);
