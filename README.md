# Impact Cart Notifier

A WooCommerce plugin that detects when a cart item's quantity changes and notifies the user. The alert only fires after WooCommerce confirms the update on the server, not before.

---

## Setting it up

I used LocalWP to run this locally. If you want to test it:

1. Download and install LocalWP from https://localwp.com
2. Import the ZIP I have shared into LocalWP
3. Start the site and open WP Admin
4. Login with username `admin` and password `Admin@1234`
5. Go to Plugins and make sure Impact Cart Notifier is activated
6. Visit the shop at `http://impact-woo-demo.local/shop`
7. Add a couple of products to the cart
8. Go to the cart page at `http://impact-woo-demo.local/cart`
9. Change a quantity and click Update cart
10. You should see an alert pop up

The plugin files are here if you want to read through the code:

```
wp-content/plugins/impact-cart-notifier/
├── impact-cart-notifier.php
└── impact-cart-notifier.js
```

---

## Questions

---

### 1. Which hooks did I use and why?

**`wp_enqueue_scripts`**

WordPress has a proper system for loading JS files. The idea is that instead of just dropping a script tag somewhere in the HTML, you tell WordPress what files you need and it handles loading them in the right order. That matters because our JS depends on jQuery, so jQuery needs to be loaded first. Using `wp_enqueue_scripts` makes sure that happens automatically.

**`updated_cart_totals`**

When the user clicks Update cart, WooCommerce sends the new quantity to the server in the background. The server processes it and sends back a confirmation. `updated_cart_totals` is the event that fires in the browser only after that confirmation comes back.

That is exactly why I used it. I did not want to show the alert the moment the user types a new number. I wanted to wait until the server actually confirmed the change was saved. This event gave me that guarantee.

---

### 2. How does the browser know the quantity changed?

When the cart page loads, I store a snapshot of all the current quantities. Something like Tshirt is 2, Redhat is 1.

When the user changes a quantity and clicks Update cart, WooCommerce talks to the server. Once the server confirms, `updated_cart_totals` fires. At that point I read the quantities from the page again and compare them to the snapshot I stored earlier. If something changed, I show the alert.

For the multiple items scenario, I also track which input box the user touched most recently using this:

```javascript
$(document).on('change', 'input[name^="cart["]', function () {
    lastChangedKey = extractKey($(this).attr('name'));
});
```

Every time the user changes any quantity input, I overwrite a variable called `lastChangedKey` with that input's key. So if the user changes Tshirt first and then Redhat, by the time they click Update cart, `lastChangedKey` holds Redhat because that was the last one touched. That is the one the alert references.

---

### 3. What would break if WooCommerce changed its DOM structure?

My JS finds the quantity input boxes using this selector:

```javascript
input[name^="cart["]
```

This works because WooCommerce currently names its quantity inputs like `cart[abc123][qty]`. My selector looks for any input whose name starts with `cart[`.

If WooCommerce ever renamed those inputs in a future update, my selector would find nothing. The plugin would just stop working with no error message, which is the worst kind of failure because it is hard to notice.

To deal with this I added `console.error` logging at the points where things could go wrong:

```javascript
if (typeof impactCartData === 'undefined') {
    console.error('Impact Cart Notifier: impactCartData not loaded, plugin may not be initialised correctly');
    return;
}

if (input.length === 0) {
    console.error('Impact Cart Notifier: Could not find input for key', lastChangedKey);
    lastChangedKey = null;
    return;
}
```

The end user never sees these messages. But a developer who opens the browser console would immediately know what broke and where. Failing silently without any trace is worse than the failure itself, so this felt like the right thing to add.

---

### 4. How would I debug this if the alert stopped working?

I would go layer by layer.

First I would check if the plugin is even loading. I would open the browser console and type:

```javascript
typeof impactCartData
```

If it returns `"object"` the plugin is loading fine. If it returns `"undefined"` the plugin is not loading at all, which usually means it is not activated in WP Admin or there is a PHP error in the plugin file.

If the plugin is loading but the alert still is not showing, I would check whether the WooCommerce event is actually firing. I would type this in the console:

```javascript
$(document.body).on('updated_cart_totals', function(){ console.log('event fired') })
```

Then I would update the cart and see if "event fired" appears. If it does not, the issue is that WooCommerce is not triggering the event, which could mean the cart page is not using the classic cart or there is a conflict with another plugin.

If the event is firing but the alert is still not showing, I would add a `console.log` inside the comparison logic to check whether the old and new quantities are being tracked correctly and figure out where the comparison is going wrong.

---

I kept the JS out of the PHP file entirely. No inline script tags anywhere. Everything goes through `wp_enqueue_scripts` because that is the right way to do it in WordPress and it keeps things clean and maintainable.

Stock limit enforcement I left to WooCommerce. It already handles that natively and since my alert only fires after a confirmed update, if WooCommerce rejects a quantity change my alert simply does not fire. There was no need to duplicate that logic.
