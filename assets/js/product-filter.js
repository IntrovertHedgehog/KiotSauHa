$(document).ready(function() {
  $("#categories").on("click", ".btn-categories", function() {
    if (this.id == "all") {
      $("#parent > div").fadeIn(450);
    } else {
      var $el = $("." + this.id).fadeIn(450);
      $("#parent > div").not($el).hide();
    }

    $("#categories .btn-categories").removeClass("active");
    $(this).addClass("active");
  });

  function searchProducts() {
    $("#categories .btn-categories").removeClass("active");
    const patterns = $("#search")
      .val()
      .split(/ +/)
      .map((p) => new RegExp(p, "i"));
    $(".box")
      .show()
      .not(function() {
        return patterns
          .map((p) => p.test($(this).find(".name, .sku, .search-term").text()))
          .every((r) => r);
      })
      .hide();
  }

  let $search = $("#search").on("input", function() {
    searchProducts();
  });

  $("body").on("click", "#jq-keyboard button", function(e) {
    if ($("#search").is(":focus")) {
      searchProducts();
    }
  });

  function searchOpenOrders() {
    var matcher = new RegExp($("#holdOrderInput").val(), "gi");
    $(".order")
      .show()
      .not(function() {
        return matcher.test($(this).find(".ref_number").text());
      })
      .hide();
  }

  var $searchHoldOrder = $("#holdOrderInput").on("input", function() {
    searchOpenOrders();
  });

  $("body").on("click", ".holdOrderKeyboard .key", function() {
    if ($("#holdOrderInput").is(":focus")) {
      searchOpenOrders();
    }
  });

  function searchCustomerOrders() {
    var matcher = new RegExp($("#holdCustomerOrderInput").val(), "gi");
    $(".customer-order")
      .show()
      .not(function() {
        return matcher.test($(this).find(".customer_name").text());
      })
      .hide();
  }

  var $searchCustomerOrder = $("#holdCustomerOrderInput").on(
    "input",
    function() {
      searchCustomerOrders();
    },
  );

  $("body").on("click", ".customerOrderKeyboard .key", function() {
    if ($("#holdCustomerOrderInput").is(":focus")) {
      searchCustomerOrders();
    }
  });

  var $list = $(".list-group-item").click(function() {
    $list.removeClass("active");
    $(this).addClass("active");
    if (this.id == "check") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Check Info");
    } else if (this.id == "card") {
      $("#cardInfo").show();
      $("#cardInfo .input-group-addon").text("Card Info");
    } else if (this.id == "cash") {
      $("#cardInfo").hide();
    }
  });

  $.fn.go = function(value, isDueInput) {
    if (isDueInput) {
      $("#refNumber").val($("#refNumber").val() + "" + value);
    } else {
      const payment = $("#payment");
      payment.val(payment.val() + "" + value);
      payment.trigger("input");
    }
  };

  $.fn.digits = function() {
    $("#payment").val($("#payment").val() + ".");
    $(this).calculateChange();
  };

  $.fn.calculateChange = function() {
    var change =
      $(this).priceToInt($("#payablePrice").val()) -
      $(this).priceToInt($("#payment").val());
    if (change <= 0) {
      $("#change").text($(this).formatPrice(change));
    } else {
      $("#change").text("0");
    }
    if (change <= 0) {
      $("#confirmPayment").show();
    } else {
      $("#confirmPayment").hide();
    }
  };
});
