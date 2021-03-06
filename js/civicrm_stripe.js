/**
 * @file
 * JS Integration between CiviCRM & Stripe.
 */
(function ($) {

  // Response from Stripe.createToken.
  function stripeResponseHandler(status, response) {

    if (response.error) {
      $('html, body').animate({ scrollTop: 0 }, 300);
      // Show the errors on the form.
      if ($(".messages.crm-error.stripe-message").length > 0) {
        $(".messages.crm-error.stripe-message").slideUp();
        $(".messages.crm-error.stripe-message:first").remove();
      }
      $("form.stripe-payment-form").prepend('<div class="messages crm-error stripe-message">'
        +'<strong>Payment Error Response:</strong>'
          +'<ul id="errorList">'
            +'<li>Error: ' + response.error.message + '</li>'
          +'</ul>'
        +'</div>');

      $('form.stripe-payment-form input.form-submit').removeAttr("disabled");
    }
    else {
      var token = response['id'];
      // Update form with the token & submit.
      $("input#stripe-token").val(token);
      $("form.stripe-payment-form").get(0).submit();
    }
  }

  // Prepare the form.
  $(document).ready(function() {
    $.getScript('https://js.stripe.com/v1/', function() {
      Stripe.setPublishableKey(CRM.stripe.pub_key);
    });
    /*
     * Identify the payment form.
     * Don't reference by form#id since it changes between payment pages
     * (Contribution / Event / etc).
     */
    $('#crm-container>form').addClass('stripe-payment-form');
    $('form.stripe-payment-form').unbind('submit');
    // Intercept form submission.
    $("form.stripe-payment-form").submit(function(event) {
      // Disable the submit button to prevent repeated clicks.
      $('form.stripe-payment-form input.form-submit').attr("disabled", "disabled");
      if ($(this).find("#priceset input[type='radio']:checked").data('amount') == 0) {
        return true;
      }

      // Handle multiple payment options and Stripe not being chosen.
      if ($(this).find(".crm-section.payment_processor-section").length > 0) {
        if (!($(this).find('input[name="hidden_processor"]').length > 0)) {
          return true;
        }
      }

      // Handle pay later (option value '0' in payment_processor radio group)
      if ($(this).find('input[name="payment_processor"]:checked').length && 
         !parseInt($(this).find('input[name="payment_processor"]:checked').val())) {
        return true;
      }
    
      // Handle changes introduced in CiviCRM 4.3.
      if ($(this).find('#credit_card_exp_date_M').length > 0) {
        var cc_month = $(this).find('#credit_card_exp_date_M').val();
        var cc_year = $(this).find('#credit_card_exp_date_Y').val();
      }
      else {
        var cc_month = $(this).find('#credit_card_exp_date\\[M\\]').val();
        var cc_year = $(this).find('#credit_card_exp_date\\[Y\\]').val();
      }

      Stripe.createToken({
        name: $('#billing_first_name').val() + ' ' + $('#billing_last_name').val(),
        address_zip: $("#billing_postal_code-5").val(),
        number: $('#credit_card_number').val(),
        cvc: $('#cvv2').val(),
        exp_month: cc_month,
        exp_year: cc_year
      }, stripeResponseHandler);

     // Prevent the form from submitting with the default action.
      return false;
    });


  });


}(jQuery));
