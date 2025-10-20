let cart = [];
let index = 0;
let allUsers = [];
let allProducts = [];
let allCategories = [];
let allTransactions = [];
let sold = [];
let state = [];
let sold_items = [];
let item;
let auth;
let holdOrder = 0;
let vat = 0;
let perms = null;
let deleteId = 0;
let paymentType = 0;
let receipt = "";
let totalVat = 0;
let subTotal = 0;
let method = "";
let order_index = 0;
let user_index = 0;
let product_index = 0;
let transaction_index;
let host = "localhost";
let path = require("path");
let port = "8001";
let moment = require("moment");
let Swal = require("sweetalert2");
let { ipcRenderer } = require("electron");
let dotInterval = setInterval(function() {
  $(".dot").text(".");
}, 3000);
let Store = require("electron-store");
const remote = require("@electron/remote");
const app = remote.app;
let img_path = app.getPath("appData") + "/KiotSauHa/uploads/";
let api = "http://" + host + ":" + port + "/api/";
let btoa = require("btoa");
let { jsPDF } = require("jspdf");
let html2canvas = require("html2canvas");
let JsBarcode = require("jsbarcode");
let macaddress = require("macaddress");
let categories = [];
let holdOrderList = [];
let customerOrderList = [];
let ownUserEdit = null;
let totalPrice = 0;
let orderTotal = 0;
let auth_error = "Tên người dùng và mật khẩu không đúng";
let auth_empty = "Xin hãy nhập tên người dùng và mật khẩu";
let holdOrderlocation = $("#randerHoldOrders");
let customerOrderLocation = $("#randerCustomerOrders");
let storage = new Store();
let settings;
let platform;
let user = {};
let start = moment().startOf("month");
let end = moment();
let start_date = moment(start).toDate();
let end_date = moment(end).toDate();
let by_till = 0;
let by_user = 0;
let by_status = 1;
let skuFocusTarget = "#skuCode"; // "skuCode" | "newSkuCode"
let justGotIn = true;
let ambiguousProducts = [];

const language = {
  search: "Tìm kiếm",
  paginate: {
    previous: "Trước",
    next: "Sau",
  },
  info: "Hiển thị _START_-_END_ trên _TOTAL_ mục ",
  infoEmpty: "Không có dữ liệu",
  lengthMenu: "Hiển thị _MENU_ mục",
};

const dateRangeLocale = {
  format: "DD/MM/YYYY",
  daysOfWeek: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  monthNames: [
    "Th.1",
    "Th.2",
    "Th.3",
    "Th.4",
    "Th.5",
    "Th.6",
    "Th.7",
    "Th.8",
    "Th.9",
    "Th.10",
    "Th.11",
    "Th.12",
  ],
  customRangeLabel: "Ngày tùy chỉnh",
  applyLabel: "OK",
  cancelLabel: "Hủy"
};

function formatInputPrice(e) {
  $(this).calculateChange();
  let val = e.target.value.replace(/\D/g, "");
  val = formatPrice(priceToInt(val));
  $(this).val(val);
}

function formatPrice(price) {
  return parseInt(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function priceToInt(priceTag) {
  if (priceTag == "") {
    return 0;
  }
  return parseInt(priceTag.replaceAll(",", ""));
}

$.fn.formatPrice = formatPrice;
$.fn.priceToInt = priceToInt;

function resetAjax() {
  $.ajaxSetup({
    contentType: "application/json; charset=utf-8",
    cache: false,
    headers: {
      authorization: auth && auth.token,
    },
  });
}

resetAjax();

$(function() {
  function cb(start, end) {
    $("#reportrange span").html(
      start.format("DD/MM/YYYY") + "  -  " + end.format("DD/MM/YYYY"),
    );
  }

  $("#reportrange").daterangepicker(
    {
      startDate: start,
      endDate: end,
      autoApply: true,
      timePicker: true,
      timePicker24Hour: true,
      timePickerIncrement: 10,
      timePickerSeconds: true,
      // minDate: '',
      ranges: {
        "Tất cả": [moment(0), moment().add(1, "days").endOf("day")],
        "Hôm nay": [moment().startOf("day"), moment().endOf("day")],
        "Hôm qua": [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "7 ngày truớc": [
          moment().subtract(6, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "30 ngày truớc": [
          moment().subtract(29, "days").startOf("day"),
          moment().endOf("day"),
        ],
        "Tháng này": [moment().startOf("month"), moment().endOf("month")],
        "Tháng trước": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
      },
      locale: dateRangeLocale
    },
    cb,
  );

  $("#inputDiscount").on("input", formatInputPrice);

  $("#product_price").on("input", formatInputPrice);

  cb(start, end);

  $('input[name="bestBefore"]').daterangepicker({
    singleDatePicker: true,
    showDropdowns: true,
    minYear: 1901,
    maxYear: parseInt(moment().format("YYYY"), 10),
    locale: dateRangeLocale,
  });
});

$.fn.serializeObject = function() {
  var o = {};
  var a = this.serializeArray();
  $.each(a, function() {
    if (o[this.name]) {
      if (!o[this.name].push) {
        o[this.name] = [o[this.name]];
      }
      o[this.name].push(this.value || "");
    } else {
      o[this.name] = this.value || "";
    }
  });
  return o;
};

auth = storage.get("auth");
user = storage.get("user");

if (auth == undefined) {
  $.get(api + "users/check/", function(data) { });
  $("#loading").show();
  authenticate();
} else {
  $.ajax({
    url: api + "users/verify-token",
    headers: {
      authorization: auth.token,
    },
    success: function(data) {
      console.log(data);
      resetAjax();
      logOnToSystem();
    },
    error: function(err) {
      // force login if expire
      console.error(err);
      $.get(api + "users/check/", function(data) { });
      $("#loading").show();
      authenticate();
      $.notify(err.responseText, "error");
    },
  });
}

function logOnToSystem() {
  $("#loading").show();

  setTimeout(function() {
    $("#loading").hide();
  }, 2000);

  platform = storage.get("settings");

  if (platform != undefined) {
    if (platform.app == "Network Point of Sale Terminal") {
      api = "http://" + platform.ip + ":" + port + "/api/";
      perms = true;
    }
  }

  $.get(api + "users/user/" + user._id, function(data) {
    user = data;
    $("#loggedin-user").text(user.fullname);
  });

  $.get(api + "settings/get", function(data) {
    settings = data.settings;
    $("#gross_price").text(`${settings.symbol}0`);
    $("#price").text(`${settings.symbol}0`);
  });

  $.get(api + "users/all", function(users) {
    allUsers = [...users];
  });

  $(document).ready(function() {
    $(".loading").hide();

    loadCategories();
    loadProducts();
    loadCustomers();

    if (settings && settings.symbol) {
      $("#price_curr, #payment_curr, #change_curr").text(settings.symbol);
    }

    setTimeout(function() {
      if (settings == undefined && auth != undefined) {
        $("#settingsModal").modal("show");
      } else {
        vat = parseFloat(settings.percentage);
        $("#taxInfo").text(settings.charge_tax ? vat : 0);
      }
    }, 1500);

    $("#settingsModal").on("hide.bs.modal", function() {
      setTimeout(function() {
        if (settings == undefined && auth != undefined) {
          $("#settingsModal").modal("show");
        }
      }, 1000);
    });

    if (0 == user.perm_products) {
      $(".p_one").hide();
    }
    if (0 == user.perm_categories) {
      $(".p_two").hide();
    }
    if (0 == user.perm_transactions) {
      $(".p_three").hide();
    }
    if (0 == user.perm_users) {
      $(".p_four").hide();
    }
    if (0 == user.perm_settings) {
      $(".p_five").hide();
    }

    function loadProducts() {
      $.get(api + "inventory/products", function(data) {
        data.forEach((item) => {
          item.price = formatPrice(item.price);
        });

        allProducts = [...data];

        loadProductList();

        $("#parent").text("");
        $("#categories").html(
          `<button type="button" id="all" class="btn btn-categories btn-white waves-effect waves-light">All</button> `,
        );

        data.forEach((item) => {
          if (!categories.includes(item.category)) {
            categories.push(item.category);
          }

          let item_info = `<div class="col-lg-2 box ${item.category}"
                                onclick="$(this).addToCart(${item._id}, ${item.quantity}, ${item.stock})">
                            <div class="widget-panel widget-style-2 ">                    
                            <div hidden class="search-term">${item.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")}</div>
                            <div id="image"><img src="${item.img == "" ? "./assets/images/default.jpg" : img_path + item.img}" id="product_img" alt=""></div>                    
                                        <div class="text-muted m-t-5 text-center">
                                        <div class="name" id="product_name">${item.name}</div> 
                                        <span class="sku">${item.sku}</span>
                                        <span class="stock">SL </span><span class="count">${item.stock == 1 ? item.quantity : "N/A"}</span></div>
                                        <sp class="text-success text-center"><b data-plugin="counterup">${settings.symbol + item.price}</b> </sp>
                            </div>
                        </div>`;
          $("#parent").append(item_info);
        });

        categories.forEach((category) => {
          let c = allCategories.filter(function(ctg) {
            return ctg._id == category;
          });

          $("#categories").append(
            `<button type="button" id="${category}" class="btn btn-categories btn-white waves-effect waves-light">${c.length > 0 ? c[0].name : ""}</button> `,
          );
        });
      });
    }

    function loadCategories() {
      $.get(api + "categories/all", function(data) {
        allCategories = data;
        loadCategoryList();
        $("#category").html(`<option value="0">Chọn</option>`);
        allCategories.forEach((category) => {
          $("#category").append(
            `<option value="${category._id}">${category.name}</option>`,
          );
        });
      });
    }

    function loadCustomers() {
      $.get(api + "customers/all", function(customers) {
        $("#customer").html(
          `<option value="0" selected="selected">Khách lạ</option>`,
        );

        customers.forEach((cust) => {
          let customer = `<option value='{"id": ${cust._id}, "name": "${cust.name}"}'>${cust.name}</option>`;
          $("#customer").append(customer);
        });

        //  $('#customer').chosen();
      });
    }

    $.fn.addToCart = function(id, count, stock) {
      if (stock == 1) {
        if (count > 0) {
          $.get(api + "inventory/product/" + id, function(data) {
            $(this).addProductToCart(data);
          });
        } else {
          Swal.fire("Hết hàng", "Mặt hàng này hiện đã hết trong kho", "info");
        }
      } else {
        $.get(api + "inventory/product/" + id, function(data) {
          $(this).addProductToCart(data);
        });
      }
    };

    function barcodeSearch(e) {
      e.preventDefault();
      $("#basic-addon2").empty();
      $("#basic-addon2").append($("<i>", { class: "fa fa-spinner fa-spin" }));

      let req = {
        skuCode: $("#skuCode").val(),
      };

      $.ajax({
        url: api + "inventory/product/sku",
        type: "POST",
        data: JSON.stringify(req),
        processData: false,
        success: function(data) {
          if (data.length == 0) {
            Swal.fire(
              "Không tìm thấy",
              "<b>" +
              $("#skuCode").val() +
              "</b> không phải là mã vạch hợp lệ!",
              "warning",
            );

            $("#searchBarCode").get(0).reset();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-ok" }),
            );
          } else if (data.length == 1) {
            let prod = data[0];
            if (
              prod._id != undefined &&
              (prod.stock == 0 || prod.quantity >= 1)
            ) {
              $(this).addProductToCart(prod);
              $("#searchBarCode").get(0).reset();
              $("#basic-addon2").empty();
              $("#basic-addon2").append(
                $("<i>", { class: "glyphicon glyphicon-ok" }),
              );
            } else if (data.quantity < 1) {
              Swal.fire(
                "Hết hàng",
                "Mặt hàng này hiện đã hết trong kho",
                "info",
              );
            }
          } else {
            // more than one product with the skucode
            ambiguousProducts = data;
            $(this).pickAmbiguousProduct();
          }
        },
        error: function(data) {
          if (data.status === 422) {
            $(this).showValidationError(data);
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else if (data.status === 404) {
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-remove" }),
            );
          } else {
            $(this).showServerError();
            $("#basic-addon2").empty();
            $("#basic-addon2").append(
              $("<i>", { class: "glyphicon glyphicon-warning-sign" }),
            );
          }
        },
      });
    }

    $("#searchBarCode").on("submit", function(e) {
      barcodeSearch(e);
    });

    $("body").on("click", "#jq-keyboard button", function(e) {
      let pressed = $(this)[0].className.split(" ");
      if ($("#skuCode").val() != "" && pressed[2] == "enter") {
        barcodeSearch(e);
      }
    });

    $.fn.addProductToCart = function(data) {
      item = {
        id: data._id,
        product_name: data.name,
        sku: data.sku,
        price: data.price,
        quantity: 1,
      };

      if ($(this).isExist(item)) {
        $(this).qtIncrement(index);
      } else {
        cart.push(item);
        $(this).renderTable(cart);
      }
    };

    $.fn.isExist = function(data) {
      let toReturn = false;
      $.each(cart, function(index, value) {
        if (value.id == data.id) {
          $(this).setIndex(index);
          toReturn = true;
        }
      });
      return toReturn;
    };

    $.fn.setIndex = function(value) {
      index = value;
    };

    $.fn.calculateCart = function() {
      let total = 0;
      let grossTotal;
      $("#total").text(cart.length);
      $.each(cart, function(index, data) {
        total += data.quantity * data.price;
      });
      total = total - priceToInt($("#inputDiscount").val());
      $("#price").text(settings.symbol + formatPrice(total));

      subTotal = total;

      if (settings.charge_tax) {
        totalVat = (total * vat) / 100;
        grossTotal = total + totalVat;
      } else {
        grossTotal = total;
      }

      orderTotal = grossTotal;

      $("#gross_price").text(settings.symbol + formatPrice(orderTotal));
      $("#payablePrice").val(formatPrice(orderTotal));
    };

    $.fn.renderTable = function(cartList) {
      $("#cartTable > tbody").empty();
      $(this).calculateCart();
      $.each(cartList, function(index, data) {
        $("#cartTable > tbody").append(
          $("<tr>").append(
            $("<td>", { text: index + 1 }).attr("width", "30px"),
            $("<td>", { text: data.product_name }).attr("width", "200px"),
            $("<td>")
              .attr("width", "180px")
              .append(
                $("<div>", { class: "input-group" }).append(
                  $("<div>", { class: "input-group-btn btn-xs" }).append(
                    $("<button>", {
                      class: "btn btn-default btn-xs",
                      onclick: "$(this).qtDecrement(" + index + ")",
                    }).append($("<i>", { class: "fa fa-minus" })),
                  ),
                  $("<input>", {
                    class: "form-control",
                    type: "number",
                    value: data.quantity,
                    onInput: "$(this).qtInput(" + index + ")",
                  }),
                  $("<div>", { class: "input-group-btn btn-xs" }).append(
                    $("<button>", {
                      class: "btn btn-default btn-xs",
                      onclick: "$(this).qtIncrement(" + index + ")",
                    }).append($("<i>", { class: "fa fa-plus" })),
                  ),
                ),
              ),
            $("<td>", {
              text: settings.symbol + formatPrice(data.price * data.quantity),
            }).attr("width", "80px"),
            $("<td>")
              .attr("width", "30px")
              .append(
                $("<button>", {
                  class: "btn btn-danger btn-xs",
                  onclick: "$(this).deleteFromCart(" + index + ")",
                }).append($("<i>", { class: "fa fa-times" })),
              ),
          ),
        );
      });
    };

    $.fn.deleteFromCart = function(index) {
      cart.splice(index, 1);
      $(this).renderTable(cart);
    };

    $.fn.qtIncrement = function(i) {
      item = cart[i];

      let product = allProducts.filter(function(selected) {
        return selected._id == parseInt(item.id);
      });

      if (product[0].stock == 1) {
        if (item.quantity < product[0].quantity) {
          item.quantity += 1;
          $(this).renderTable(cart);
        } else {
          Swal.fire(
            "Hết hàng!",
            "Bạn đã thêm toàn bộ hàng còn trong kho",
            "info",
          );
        }
      } else {
        item.quantity += 1;
        $(this).renderTable(cart);
      }
    };

    $.fn.qtDecrement = function(i) {
      if (item.quantity > 1) {
        item = cart[i];
        item.quantity -= 1;
        $(this).renderTable(cart);
      }
    };

    $.fn.qtInput = function(i) {
      item = cart[i];
      item.quantity = $(this).val();
      $(this).renderTable(cart);
    };

    $.fn.cancelOrder = function() {
      if (cart.length > 0) {
        Swal.fire({
          title: "Chắc chưa?",
          text: "Chuẩn bị xóa hết đơn hàng.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Xóa đi",
          cancelButtonText: "Hủy",
        }).then((result) => {
          if (result.value) {
            cart = [];
            $(this).renderTable(cart);
            holdOrder = 0;

            Swal.fire(
              "Đã xóa",
              "Những mặt hàng trong đơn trước đã bị xóa sạch",
              "success",
            );
          }
        });
      }
    };

    $("#payButton").on("click", function() {
      if (cart.length != 0) {
        paymentType = 1;
        $("#paymentModel").modal("toggle");
      } else {
        Swal.fire("Ủa!!", "Đâu có gì trong đơn mà thanh toán", "warning");
      }
    });

    $("#hold").on("click", function() {
      if (cart.length != 0) {
        $("#dueModal").modal("toggle");
      } else {
        Swal.fire("Ủa!!", "Đâu có gì trong đơn mà cho nợ", "warning");
      }
    });

    function printJobComplete() {
      alert("print job complete");
    }

    $.fn.submitDueOrder = function(status) {
      let items = "";
      let payment = 0;

      cart.forEach((item) => {
        items +=
          "<tr><td>" +
          item.product_name +
          "</td><td>" +
          item.quantity +
          "</td><td>" +
          settings.symbol +
          formatPrice(item.price) +
          "</td></tr>";
      });

      let currentTime = new Date(moment());

      let discount = priceToInt($("#inputDiscount").val());
      let customer = JSON.parse($("#customer").val());
      let date = moment(currentTime).format("DD/MM/YYYY HH:mm:ss");
      let paid = priceToInt(
        $("#payment").val() == "" ? "0" : $("#payment").val(),
      );
      let change = priceToInt(
        $("#change").text() == "" ? "0" : $("#change").text(),
      );
      let refNumber = $("#refNumber").val();
      let orderNumber = holdOrder;
      let type = "";
      let tax_row = "";

      switch (paymentType) {
        case 1:
          type = "Tiền mặt";
          break;

        case 2:
          type = "Chuyển khoản";
          break;
      }

      if (paid != "") {
        payment = `<tr>
                        <td>Đã trả</td>
                        <td>:</td>
                        <td>${settings.symbol + formatPrice(paid)}</td>
                    </tr>
                    <tr>
                        <td>Thối</td>
                        <td>:</td>
                        <td>${settings.symbol + formatPrice(change)}</td>
                    </tr>
                    <tr>
                        <td>Phương thức TT</td>
                        <td>:</td>
                        <td>${type}</td>
                    </tr>`;
      }

      if (settings.charge_tax) {
        tax_row = `<tr>
                    <td>Thuế VAT:(${settings.percentage})% </td>
                    <td>:</td>
                    <td>${settings.symbol}${formatPrice(totalVat)}</td>
                </tr>`;
      }

      if (status == 0) {
        if ($("#customer").val() == 0 && $("#refNumber").val() == "") {
          Swal.fire(
            "Thiếu số tham chiếu",
            "Bạn cần nhập số tham chiếu hoặc tên khách hàng",
            "warning",
          );

          return;
        }
      }

      $(".loading").show();

      if (holdOrder != 0) {
        orderNumber = holdOrder;
        method = "PUT";
      } else {
        orderNumber = Math.floor(Date.now() / 1000);
        method = "POST";
      }

      receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != "" ? "Số điện thoại: " + settings.contact + "<br>" : ""} 
            ${settings.tax != "" ? "Mã số thuế" + settings.tax + "<br>" : ""} 
        </p>
        <hr>
        <left>
            <p>
            Hóa đơn số: ${orderNumber} <br>
            Số tham chiếu: ${refNumber == "" ? orderNumber : refNumber} <br>
            Tên khách hàng: ${customer == 0 ? "Khách lạ" : customer.name} <br>
            Thu ngân: ${user.fullname} <br>
            Ngày, giờ: ${date}<br>
            </p>

        </left>
        <hr>
        <table width="100%">
            <thead style="text-align: left;">
            <tr>
                <th>Mặt hàng</th>
                <th>SL</th>
                <th>Giá</th>
            </tr>
            </thead>
            <tbody>
            ${items}                
     
            <tr>                        
                <td><b>Tổng</b></td>
                <td>:</td>
                <td><b>${settings.symbol}${formatPrice(subTotal)}</b></td>
            </tr>
            <tr>
                <td>Ưu đãi</td>
                <td>:</td>
                <td>${discount > 0 ? settings.symbol + formatPrice(discount) : ""}</td>
            </tr>
            
            ${tax_row}
        
            <tr>
                <td><h3>Thành tiền</h3></td>
                <td><h3>:</h3></td>
                <td>
                    <h3>${settings.symbol}${formatPrice(orderTotal)}</h3>
                </td>
            </tr>
            ${payment == 0 ? "" : payment}
            </tbody>
            </table>
            <br>
            <hr>
            <br>
            <p style="text-align: center;">
             ${settings.footer}
             </p>
            </div>`;

      if (status == 3) {
        if (cart.length > 0) {
          printJS({ printable: receipt, type: "raw-html" });

          $(".loading").hide();
          return;
        } else {
          $(".loading").hide();
          return;
        }
      }

      let data = {
        order: orderNumber,
        ref_number: refNumber,
        discount: discount,
        customer: customer,
        status: status,
        subtotal: subTotal,
        tax: totalVat,
        order_type: 1,
        items: cart,
        date: currentTime,
        payment_type: paymentType,
        payment_info: $("#paymentInfo").val(),
        total: orderTotal,
        paid: paid,
        change: change,
        _id: orderNumber,
        till: platform.till,
        mac: platform.mac,
        user: user.fullname,
        user_id: user._id,
      };

      $.ajax({
        url: api + "new",
        type: method,
        data: JSON.stringify(data),
        processData: false,
        success: function(data) {
          cart = [];
          $("#inputDiscount").val("");
          $("#viewTransaction").html("");
          $("#viewTransaction").html(receipt);
          $("#orderModal").modal("show");
          loadProducts();
          loadCustomers();
          $(".loading").hide();
          $("#dueModal").modal("hide");
          $("#paymentModel").modal("hide");
          $(this).getHoldOrders();
          $(this).getCustomerOrders();
          $(this).renderTable(cart);
        },
        error: function(data) {
          $(".loading").hide();
          $("#dueModal").modal("toggle");
          Swal(
            "Something went wrong!",
            "Please refresh this page and try again",
          );
        },
      });

      $("#refNumber").val("");
      $("#change").text("0");
      $("#payment").val("");
    };

    $.get(api + "on-hold", function(data) {
      holdOrderList = data;
      holdOrderlocation.empty();
      clearInterval(dotInterval);
      $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
    });

    $.fn.getHoldOrders = function() {
      $.get(api + "on-hold", function(data) {
        holdOrderList = data;
        clearInterval(dotInterval);
        holdOrderlocation.empty();
        $(this).randerHoldOrders(holdOrderList, holdOrderlocation, 1);
      });
    };

    $.fn.randerHoldOrders = function(data, renderLocation, orderType) {
      $.each(data, function(index, order) {
        $(this).calculatePrice(order);
        renderLocation.append(
          $("<div>", {
            class:
              orderType == 1 ? "col-md-3 order" : "col-md-3 customer-order",
          }).append(
            $("<a>").append(
              $("<div>", { class: "card-box order-box" }).append(
                $("<p>").append(
                  $("<b>", { text: "Mã đối chiếu :" }),
                  $("<span>", { text: order.ref_number, class: "ref_number" }),
                  $("<br>"),
                  $("<b>", { text: "Giá trị :" }),
                  $("<span>", {
                    text: order.total,
                    class: "label label-info",
                    style: "font-size:14px;",
                  }),
                  $("<br>"),
                  $("<b>", { text: "Số lượng :" }),
                  $("<span>", { text: order.items.length }),
                  $("<br>"),
                  $("<b>", { text: "Khách :" }),
                  $("<span>", {
                    text:
                      order.customer != 0
                        ? order.customer.name
                        : "Walk in customer",
                    class: "customer_name",
                  }),
                ),
                $("<button>", {
                  class: "btn btn-danger del",
                  onclick:
                    "$(this).deleteOrder(" + index + "," + orderType + ")",
                }).append($("<i>", { class: "fa fa-trash" })),

                $("<button>", {
                  class: "btn btn-default",
                  onclick:
                    "$(this).orderDetails(" + index + "," + orderType + ")",
                }).append($("<span>", { class: "fa fa-shopping-basket" })),
              ),
            ),
          ),
        );
      });
    };

    $.fn.calculatePrice = function(data) {
      totalPrice = 0;
      $.each(data.products, function(index, product) {
        totalPrice += product.price * product.quantity;
      });

      let vat = (totalPrice * data.vat) / 100;
      totalPrice = formatPrice(totalPrice + vat - data.discount);

      return totalPrice;
    };

    $.fn.orderDetails = function(index, orderType) {
      $("#refNumber").val("");

      if (orderType == 1) {
        $("#refNumber").val(holdOrderList[index].ref_number);

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function() {
            return $(this).text() == "Walk in customer";
          })
          .prop("selected", true);

        holdOrder = holdOrderList[index]._id;
        cart = [];
        $.each(holdOrderList[index].items, function(index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      } else if (orderType == 2) {
        $("#refNumber").val("");

        $("#customer option:selected").removeAttr("selected");

        $("#customer option")
          .filter(function() {
            return $(this).text() == customerOrderList[index].customer.name;
          })
          .prop("selected", true);

        holdOrder = customerOrderList[index]._id;
        cart = [];
        $.each(customerOrderList[index].items, function(index, product) {
          item = {
            id: product.id,
            product_name: product.product_name,
            sku: product.sku,
            price: product.price,
            quantity: product.quantity,
          };
          cart.push(item);
        });
      }
      $(this).renderTable(cart);
      $("#holdOrdersModal").modal("hide");
      $("#customerModal").modal("hide");
    };

    $.fn.deleteOrder = function(index, type) {
      switch (type) {
        case 1:
          deleteId = holdOrderList[index]._id;
          break;
        case 2:
          deleteId = customerOrderList[index]._id;
      }

      let data = {
        orderId: deleteId,
      };

      Swal.fire({
        title: "Chắc chưa??",
        text: "Bạn có chắc muốn xóa đơn hàng này không?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xóa đi!",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.value) {
          $.ajax({
            url: api + "delete",
            type: "POST",
            data: JSON.stringify(data),
            success: function(data) {
              $(this).getHoldOrders();
              $(this).getCustomerOrders();

              Swal.fire("Đã xóa!", "Bạn đã xóa thành công đơn hàng", "success");
            },
            error: function(data) {
              $(".loading").hide();
            },
          });
        }
      });
    };

    $.fn.getCustomerOrders = function() {
      $.get(api + "customer-orders", function(data) {
        clearInterval(dotInterval);
        customerOrderList = data;
        customerOrderLocation.empty();
        $(this).randerHoldOrders(customerOrderList, customerOrderLocation, 2);
      });
    };

    $("#saveCustomer").on("submit", function(e) {
      e.preventDefault();

      let custData = {
        _id: Math.floor(Date.now() / 1000),
        name: $("#userName").val(),
        phone: $("#phoneNumber").val(),
        email: $("#emailAddress").val(),
        address: $("#userAddress").val(),
      };

      $.ajax({
        url: api + "customers/customer",
        type: "POST",
        data: JSON.stringify(custData),
        processData: false,
        success: function(data) {
          $("#newCustomer").modal("hide");
          Swal.fire("Xong!", "Đã thêm khách hàng thành công.", "success");
          $("#customer option:selected").removeAttr("selected");
          $("#customer").append(
            $("<option>", {
              text: custData.name,
              value: `{"id": ${custData._id}, "name": ${custData.name}}`,
              selected: "selected",
            }),
          );

          $("#customer")
            .val(`{"id": ${custData._id}, "name": ${custData.name}}`)
            .trigger("chosen:updated");
        },
        error: function(data) {
          $("#newCustomer").modal("hide");
          Swal.fire(
            "Lỗi",
            "Đã xảy ra lỗi, tôi chả biết lỗi gì nhma có lỗi.",
            "error",
          );
        },
      });
    });

    $("#confirmPayment").hide();

    $("#cardInfo").hide();

    $("#payment").on("input", formatInputPrice);

    $("#confirmPayment").on("click", function() {
      if ($("#payment").val() == "") {
        Swal.fire(
          "Không hợp lệ",
          "Hãy nhập số tiền mà khách đưa bạn",
          "warning",
        );
      } else {
        $(this).submitDueOrder(1);
      }
    });

    $("#transactions").click(function() {
      justGotIn = true;
      loadTransactions();
      loadUserList();

      $("#pos_view").hide();
      $("#pointofsale").show();
      $("#transactions_view").show();
      $(this).hide();
    });

    $("#pointofsale").click(function() {
      $("#pos_view").show();
      $("#transactions").show();
      $("#transactions_view").hide();
      $(this).hide();
    });

    $("#viewRefOrders").click(function() {
      setTimeout(function() {
        $("#holdOrderInput").focus();
      }, 500);
    });

    $("#viewCustomerOrders").click(function() {
      setTimeout(function() {
        $("#holdCustomerOrderInput").focus();
      }, 500);
    });

    $("#newProductModal").click(function() {
      skuFocusTarget = "#newSkuCode";
      $("#saveProduct").get(0).reset();
      $("#bestBefore").val("");
      $("#bestBeforeField").hide();
      $("#current_img").text("");
    });

    $("#newSkuCode").on("keydown", function(e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        // Find all focusable elements
        let $focusable = $(
          "input, select, textarea, button, a[href], [tabindex]:not([tabindex='-1'])",
        ).filter(":visible");

        let index = $focusable.index(this);
        if (index > -1 && index + 1 < $focusable.length) {
          $focusable.eq(index + 1).focus(); // move to next
        }
      }
    });

    $("#hasBestBefore").on("change", function(event) {
      if (event.target.checked) {
        $("#bestBeforeField").show();
      } else {
        $("#bestBefore").val("");
        $("#bestBeforeField").hide();
      }
    })

    $("#saveProduct").submit(function(e) {
      e.preventDefault();

      const price_sel = $("#product_price");
      price_sel.val(priceToInt(price_sel.val()));

      $(this).attr("action", api + "inventory/product");
      $(this).attr("method", "POST");

      $(this).ajaxSubmit({
        contentType: "application/json",
        success: function(response) {
          $("#saveProduct").get(0).reset();
          $("#current_img").text("");

          loadProducts();
          Swal.fire({
            title: "Đã lưu mặt hàng",
            text: "Nhấn một trong hai nút để tiếp tục",
            icon: "success",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Thêm mặt hàng khác",
            cancelButtonText: "Đóng",
          }).then((result) => {
            if (!result.value) {
              $("#newProduct").modal("hide");
              skuFocusTarget = "#skuCode";
            }
          });
        },
        error: function(data) {
          console.log(data);
        },
      });
    });

    $("#saveCategory").submit(function(e) {
      e.preventDefault();

      if ($("#category_id").val() == "") {
        method = "POST";
      } else {
        method = "PUT";
      }

      const formData = $(this).serializeObject();

      $.ajax({
        type: method,
        url: api + "categories/category",
        data: JSON.stringify(formData),
        success: function(data, textStatus, jqXHR) {
          $("#saveCategory").get(0).reset();
          loadCategories();
          loadProducts();
          Swal.fire({
            title: "Đã lưu thể loại",
            text: "Nhấn một trong hai nút để tiếp tục",
            icon: "success",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Thêm thể loại khác",
            cancelButtonText: "Đóng",
          }).then((result) => {
            if (!result.value) {
              $("#newCategory").modal("hide");
            }
          });
        },
        error: function(data) {
          console.log(data);
        },
      });
    });

    $.fn.addProductTocartFromSkuCode = function(index) {
      let prod = ambiguousProducts[index];
      $(this).addProductToCart(prod);
      $("#searchBarCode").get(0).reset();
      $("#basic-addon2").empty();
      $("#basic-addon2").append($("<i>", { class: "glyphicon glyphicon-ok" }));
      $("#Products").modal("hide");
    };

    $.fn.pickAmbiguousProduct = function() {
      let products = ambiguousProducts;
      $("#Products").modal();
      let product_list = "";
      let counter = 0;
      $("#product_list").empty();
      $("#productList").DataTable().destroy();

      console.log(products);

      products.forEach((product, index) => {
        counter++;

        let category = allCategories.filter(function(category) {
          return category._id == product.category;
        });

        product_list +=
          `<tr>
            <td>${product.skuCode} ${product.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")}</td>
            <td><img id="` +
          product._id +
          `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product.img == "" ? "./assets/images/default.jpg" : img_path + product.img}" id="product_img"></td>
            <td>${product.name}</td>
            <td>${settings.symbol}${product.price}</td>
            <td>${product.stock == 1 ? product.quantity : "N/A"}</td>
            <td>${category.length > 0 ? category[0].name : ""}</td>
            <td class="nobr">
              <span class="btn-group">
                <button onClick="$(this).addProductTocartFromSkuCode(${index})" class="btn btn-warning btn-sm"><i class="fa fa-mouse-pointer"></i></button>
              </span>
            </td>
          </tr>`;
      });

      if (counter == products.length) {
        $("#product_list").html(product_list);

        products
          .filter((pro) => pro.skuCode)
          .forEach((pro) => {
            $("#" + pro._id + "").JsBarcode(pro.skuCode, {
              width: 2,
              height: 25,
              fontSize: 14,
            });
          });

        $("#productList").DataTable({
          order: [[4, "desc"]],
          autoWidth: false,
          info: true,
          JQueryUI: true,
          ordering: true,
          paging: true,
          language,
        });
      }
    };

    $.fn.editProduct = function(index) {
      $("#Products").modal("hide");

      $("#category option")
        .filter(function() {
          return $(this).val() == allProducts[index].category;
        })
        .prop("selected", true);

      $("#newSkuCode").val(allProducts[index].skuCode);
      $("#productName").val(allProducts[index].name);
      $("#product_price").val(allProducts[index].price);
      $("#quantity").val(allProducts[index].quantity);

      $("#product_id").val(allProducts[index]._id);
      $("#img").val(allProducts[index].img);
      $("#hasBestBefore").prop("checked", allProducts[index].hasBestBefore)
      let bestBeforeQ = $("#bestBefore")
      if (allProducts[index].hasBestBefore) {
        bestBeforeQ.show();
        bestBeforeQ.val(allProducts[index].bestBefore);
        $("#hasBestBefore").prop("checked", allProducts[index].hasBestBefore)
      } else {
        bestBeforeQ.val("");
        bestBeforeQ.hide();
      }

      if (allProducts[index].img != "") {
        $("#imagename").hide();
        $("#current_img").html(
          `<img src="${img_path + allProducts[index].img}" alt="">`,
        );
        $("#rmv_img").show();
      }

      if (allProducts[index].stock == 0) {
        $("#stock").prop("checked", true);
      }

      $("#newProduct").modal("show");
    };

    $("#userModal").on("hide.bs.modal", function() {
      $(".perms").hide();
    });

    $.fn.editUser = function(index) {
      user_index = index;

      $("#Users").modal("hide");

      $(".perms").show();

      $("#user_id").val(allUsers[index]._id);
      $("#fullname").val(allUsers[index].fullname);
      $("#username").val(allUsers[index].username);
      $("#password").val();

      $("#perm_products").prop("checked", allUsers[index].perm_products);
      $("#perm_categories").prop("checked", allUsers[index].perm_categories);
      $("#perm_transactions").prop(
        "checked",
        allUsers[index].perm_transactions,
      );
      $("#perm_users").prop("checked", allUsers[index].perm_users);
      $("#perm_settings").prop("checked", allUsers[index].perm_settings);

      $("#userModal").modal("show");
    };

    $.fn.editCategory = function(index) {
      $("#Categories").modal("hide");
      $("#categoryName").val(allCategories[index].name);
      $("#category_id").val(allCategories[index]._id);
      $("#newCategory").modal("show");
    };

    $.fn.deleteProduct = function(id) {
      Swal.fire({
        title: "Chắc chưa?",
        text: "Chuẩn bị xóa mặt hàng đó",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xóa đi",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.value) {
          $.ajax({
            url: api + "inventory/product/" + id,
            type: "DELETE",
            success: function(result) {
              loadProducts();
              Swal.fire("Xóa rồi", "Mặt hàng đã xoá", "success");
            },
          });
        }
      });
    };

    $.fn.deleteUser = function(id) {
      Swal.fire({
        title: "Chắc chưa",
        text: "Chuẩn bị xóa người dùng",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xóa đi",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.value) {
          $.ajax({
            url: api + "users/user/" + id,
            type: "DELETE",
            success: function(result) {
              loadUserList();
              Swal.fire("Xong", "Đã xóa người dùng", "success");
            },
          });
        }
      });
    };

    $.fn.deleteCategory = function(id) {
      Swal.fire({
        title: "Chắc chưa",
        text: "Chuẩn bị xóa thể loại",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xóa đi",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.value) {
          $.ajax({
            url: api + "categories/category/" + id,
            type: "DELETE",
            success: function(result) {
              loadCategories();
              Swal.fire("Xong", "Đã xóa thể loại", "success");
            },
          });
        }
      });
    };

    $("#productModal").click(function() {
      loadProductList();
    });

    $("#usersModal").click(function() {
      loadUserList();
    });

    $("#categoryModal").click(function() {
      loadCategoryList();
    });

    function loadUserList() {
      let counter = 0;
      let user_list = "";
      $("#user_list").empty();
      $("#userList").DataTable().destroy();

      $.get(api + "users/all", function(users) {
        allUsers = [...users];

        users.forEach((user, index) => {
          state = [];
          let class_name = "";

          if (user.status != "") {
            state = user.status.split("_");

            switch (state[0]) {
              case "Logged In":
                class_name = "btn-default";
                break;
              case "Logged Out":
                class_name = "btn-light";
                break;
            }
          }

          counter++;
          user_list += `<tr>
            <td>${user.fullname}</td>
            <td>${user.username}</td>
            <td class="${class_name}">${state.length > 0 ? state[0] : ""} <br><span style="font-size: 11px;"> ${state.length > 0 ? moment(state[1]).format("hh:mm A DD/MM/YYYY") : ""}</span></td>
            <td>${user._id == 1 ? '<span class="btn-group"><button class="btn btn-dark"><i class="fa fa-edit"></i></button><button class="btn btn-dark"><i class="fa fa-trash"></i></button></span>' : '<span class="btn-group"><button onClick="$(this).editUser(' + index + ')" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteUser(' + user._id + ')" class="btn btn-danger"><i class="fa fa-trash"></i></button></span>'}</td></tr>`;

          if (counter == users.length) {
            $("#user_list").html(user_list);

            $("#userList").DataTable({
              order: [[1, "desc"]],
              autoWidth: false,
              info: true,
              JQueryUI: true,
              ordering: true,
              paging: true,
              language,
            });
          }
        });
      });
    }

    function loadProductList() {
      let products = [...allProducts];
      let product_list = "";
      let counter = 0;
      $("#product_list").empty();
      $("#productList").DataTable().destroy();

      products.forEach((product, index) => {
        counter++;

        let category = allCategories.filter(function(category) {
          return category._id == product.category;
        });

        product_list +=
          `<tr>
            <td>${product.skuCode} ${product.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")}</td>
            <td><img id="` +
          product._id +
          `"></td>
            <td><img style="max-height: 50px; max-width: 50px; border: 1px solid #ddd;" src="${product.img == "" ? "./assets/images/default.jpg" : img_path + product.img}" id="product_img"></td>
            <td>${product.name}</td>
            <td>${settings.symbol}${product.price}</td>
            <td>${product.stock == 1 ? product.quantity : "N/A"}</td>
            <td>${category.length > 0 ? category[0].name : ""}</td>
            <td class="nobr"><span class="btn-group"><button onClick="$(this).editProduct(${index})" class="btn btn-warning btn-sm"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteProduct(${product._id})" class="btn btn-danger btn-sm"><i class="fa fa-trash"></i></button></span></td></tr>`;

        if (counter == allProducts.length) {
          $("#product_list").html(product_list);

          products
            .filter((pro) => pro.skuCode)
            .forEach((pro) => {
              $("#" + pro._id + "").JsBarcode(pro.skuCode, {
                width: 2,
                height: 25,
                fontSize: 14,
              });
            });

          $("#productList").DataTable({
            order: [[4, "desc"]],
            autoWidth: false,
            info: true,
            JQueryUI: true,
            ordering: true,
            paging: true,
            language,
          });
        }
      });
    }

    function loadCategoryList() {
      let category_list = "";
      let counter = 0;
      $("#category_list").empty();
      $("#categoryList").DataTable().destroy();

      allCategories.forEach((category, index) => {
        counter++;

        category_list += `<tr>
     
            <td>${category.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")}</td>
            <td>${category.name}</td>
            <td><span class="btn-group"><button onClick="$(this).editCategory(${index})" class="btn btn-warning"><i class="fa fa-edit"></i></button><button onClick="$(this).deleteCategory(${category._id})" class="btn btn-danger"><i class="fa fa-trash"></i></button></span></td></tr>`;
      });

      if (counter == allCategories.length) {
        $("#category_list").html(category_list);
        $("#categoryList").DataTable({
          autoWidth: false,
          info: true,
          JQueryUI: true,
          ordering: true,
          paging: true,
          language,
        });
      }
    }

    $.fn.serializeObject = function() {
      var o = {};
      var a = this.serializeArray();
      $.each(a, function() {
        if (o[this.name]) {
          if (!o[this.name].push) {
            o[this.name] = [o[this.name]];
          }
          o[this.name].push(this.value || "");
        } else {
          o[this.name] = this.value || "";
        }
      });
      return o;
    };

    $("#log-out").click(function() {
      Swal.fire({
        title: "Chắc chưa",
        text: "Chuẩn bị đăng xuất",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Đăng xuất",
        cancelButtonText: "Hủy",
      }).then((result) => {
        if (result.value) {
          $.get(api + "users/logout/" + user._id, function(data) {
            storage.delete("auth");
            storage.delete("user");
            ipcRenderer.send("app-reload", "");
          });
        }
      });
    });

    $("#settings_form").on("submit", function(e) {
      e.preventDefault();
      let formData = $(this).serializeObject();
      let mac_address;

      api = "http://" + host + ":" + port + "/api/";

      macaddress.one(function(err, mac) {
        mac_address = mac;
      });

      formData["app"] = $("#app").find("option:selected").text();
      formData["mac"] = mac_address;
      formData["till"] = 1;

      $("#settings_form").append(
        '<input type="hidden" name="app" value="' + formData.app + '" />',
      );

      if (formData.percentage != "" && !$.isNumeric(formData.percentage)) {
        Swal.fire("Ôi không", "Mã số thuế không hợp lệ", "warning");
      } else {
        storage.set("settings", formData);

        $(this).attr("action", api + "settings/post");
        $(this).attr("method", "POST");

        $(this).ajaxSubmit({
          contentType: "application/json",
          success: function(response) {
            ipcRenderer.send("app-reload", "");
          },
          error: function(data) {
            console.log(data);
          },
        });
      }
    });

    $("#net_settings_form").on("submit", function(e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.till == 0 || formData.till == 1) {
        Swal.fire("Ôi không", "Hãy nhập một số từ 2 trở lên", "warning");
      } else {
        if ($.isNumeric(formData.till)) {
          formData["app"] = $("#app").find("option:selected").text();
          storage.set("settings", formData);
          ipcRenderer.send("app-reload", "");
        } else {
          Swal.fire("Ôi không", "Hãy nhập con số hợp lệ", "warning");
        }
      }
    });

    $("#saveUser").on("submit", function(e) {
      e.preventDefault();
      let formData = $(this).serializeObject();

      if (formData.password == formData.pass) {
        $.ajax({
          url: api + "users/post",
          type: "POST",
          data: JSON.stringify(formData),
          processData: false,
          success: function(data) {
            if (ownUserEdit) {
              ipcRenderer.send("app-reload", "");
            } else {
              $("#userModal").modal("hide");

              loadUserList();

              $("#Users").modal("show");
              Swal.fire("Ok!", "Đã lưu thông tin người dùng mới", "success");
            }
          },
          error: function(data) {
            console.error(data);
          },
        });
      } else {
        $("#accept-acct-chg").notify("Mật khẩu không khớp", "error");
      }
    });

    $("#app").change(function() {
      if (
        $(this).find("option:selected").text() ==
        "Network Point of Sale Terminal"
      ) {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);
        macaddress.one(function(err, mac) {
          $("#mac").val(mac);
        });
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);
      }
    });

    $("#cashier").click(function() {
      ownUserEdit = true;

      $("#userModal").modal("show");

      $("#user_id").val(user._id);
      $("#fullname").val(user.fullname);
      $("#username").val(user.username);
      $("#password").val();
      $("#perm_products").prop("checked", user.perm_products);
      $("#perm_categories").prop("checked", user.perm_categories);
      $("#perm_transactions").prop("checked", user.perm_transactions);
      $("#perm_users").prop("checked", user.perm_users);
      $("#perm_settings").prop("checked", user.perm_settings);
    });

    $("#add-user").click(function() {
      if (platform.app != "Network Point of Sale Terminal") {
        $(".perms").show();
      }

      $("#saveUser").get(0).reset();
      $("#userModal").modal("show");
    });

    $("#settings").click(function() {
      if (platform.app == "Network Point of Sale Terminal") {
        $("#net_settings_form").show(500);
        $("#settings_form").hide(500);

        $("#ip").val(platform.ip);
        $("#till").val(platform.till);

        macaddress.one(function(err, mac) {
          $("#mac").val(mac);
        });

        $("#app option")
          .filter(function() {
            return $(this).text() == platform.app;
          })
          .prop("selected", true);
      } else {
        $("#net_settings_form").hide(500);
        $("#settings_form").show(500);

        $("#settings_id").val("1");
        $("#store").val(settings.store);
        $("#address_one").val(settings.address_one);
        $("#address_two").val(settings.address_two);
        $("#contact").val(settings.contact);
        $("#tax").val(settings.tax);
        $("#symbol").val(settings.symbol);
        $("#percentage").val(settings.percentage);
        $("#footer").val(settings.footer);
        $("#logo_img").val(settings.img);
        if (settings.charge_tax == "on") {
          $("#charge_tax").prop("checked", true);
        }
        if (settings.img != "") {
          $("#logoname").hide();
          $("#current_logo").html(
            `<img src="${img_path + settings.img}" alt="">`,
          );
          $("#rmv_logo").show();
        }

        $("#app option")
          .filter(function() {
            return $(this).text() == settings.app;
          })
          .prop("selected", true);
      }
    });
  });

  $(document).on("keydown", function(e) {
    if (!$(e.target).is("input, textarea")) {
      $(skuFocusTarget).focus();
    }
  });

  $("#rmv_logo").click(function() {
    $("#remove_logo").val("1");
    $("#current_logo").hide(500);
    $(this).hide(500);
    $("#logoname").show(500);
  });

  $("#rmv_img").click(function() {
    $("#remove_img").val("1");
    $("#current_img").hide(500);
    $(this).hide(500);
    $("#imagename").show(500);
  });

  $("#print_list").click(function() {
    $("#loading").show();

    $("#productList").DataTable().destroy();

    const filename = "productList.pdf";

    html2canvas($("#all_products").get(0)).then((canvas) => {
      let height = canvas.height * (25.4 / 96);
      let width = canvas.width * (25.4 / 96);
      let pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);

      $("#loading").hide();
      pdf.save(filename);
    });

    $("#productList").DataTable({
      order: [[1, "desc"]],
      autoWidth: false,
      info: true,
      JQueryUI: true,
      ordering: true,
      paging: true,
      language,
    });

    $(".loading").hide();
  });
}

$.fn.print = function() {
  printJS({ printable: receipt, type: "raw-html" });
};

function loadTransactions() {
  let tills = [];
  let users = [];
  let sales = 0;
  let transact = 0;
  let unique = 0;

  sold_items = [];
  sold = [];

  let counter = 0;
  let transaction_list = "";
  console.log(new Date(start_date));
  console.log(new Date(end_date));
  let query = `by-date?start=${start_date}&end=${end_date}&user=${by_user}&status=${by_status}&till=${by_till}`;

  $.get(api + query, function(transactions) {
    $("#transaction_list").empty();
    $("#transactionList").DataTable().destroy();
    $("#product_sales").empty();
    allTransactions = [];

    allTransactions = [...transactions];

    transactions.forEach((trans, index) => {
      sales += parseFloat(trans.total);
      transact++;

      trans.items.forEach((item) => {
        sold_items.push(item);
      });

      if (!tills.includes(trans.till)) {
        tills.push(trans.till);
      }

      if (!users.includes(trans.user_id)) {
        users.push(trans.user_id);
      }

      counter++;
      transaction_list += `<tr>
                                <td>${trans.order}</td>
                                <td class="nobr">${moment(trans.date).format("DD/MM/YYYY HH:mm:ss")}</td>
                                <td>${settings.symbol + formatPrice(trans.total)}</td>
                                <td>${settings.symbol + formatPrice(trans.paid)}</td>
                                <td>${settings.symbol + formatPrice(Math.abs(trans.change))}</td>
                                <td>${trans.paid == 0 ? "" : trans.payment_type == 1 ? "Tiền mặt" : "Chuyển khoản"}</td>
                                <td>${trans.till}</td>
                                <td>${trans.user}</td>
                                <td>${trans.paid == 0 ? '<button class="btn btn-dark"><i class="fa fa-search-plus"></i></button>' : '<button onClick="$(this).viewTransaction(' + index + ')" class="btn btn-info"><i class="fa fa-search-plus"></i></button></td>'}</tr>
                    `;
    });

    const result = {};

    for (const { product_name, price, quantity, id } of sold_items) {
      if (!result[id]) result[id] = [];
      result[id].push({ id, price, quantity, product_name });
    }

    for (let id in result) {
      let price = 0;
      let quantity = 0;
      let name = 0;

      result[id].forEach((i) => {
        name = i.product_name;
        price = i.price;
        quantity += i.quantity;
      });

      sold.push({
        id: id,
        product: name,
        qty: quantity,
        price: price,
      });
    }

    loadSoldProducts();

    if (by_user == 0 && by_till == 0) {
      userFilter(users);
      tillFilter(tills);
    }

    if (allTransactions.length == 0 && !justGotIn) {
      $("#reportrange").notify("Không tìm thấy dữ liệu!", {
        className: "warn",
        position: "bottom right",
        autoHideDelay: 1000,
      });
    }

    justGotIn = false;

    $("#total_sales #counter").text(settings.symbol + formatPrice(sales));
    $("#total_transactions #counter").text(transact);
    $("#transaction_list").html(transaction_list);
    $("#transactionList").DataTable({
      order: [[1, "desc"]],
      autoWidth: false,
      info: true,
      JQueryUI: true,
      ordering: true,
      paging: true,
      dom: "Bfrtip",
      buttons: [
        "pdf",
        "csv",
        {
          extend: "excel",
          customize: function(xlsx, btn, dt) {
            console.log(xlsx);
            let sheet = xlsx.xl.worksheets["sheet1.xml"];
            const nrow = dt.page.info().recordsTotal;
            const re = RegExp(`[${settings.symbol},]`, "g");
            for (let i = 3; i <= nrow + 2; ++i) {
              for (let c of ["C", "D", "E"]) {
                const node = $(`c[r=${c}${i}]`, sheet);
                const val = node.find("t").text().replaceAll(re, "");
                node.removeAttr("t").attr("s", 65).children("is").remove();
                node.append(`<v>${val}</v>`);
              }
            }
          },
        },
      ],
      language,
    });
  });
}

function discend(a, b) {
  if (a.qty > b.qty) {
    return -1;
  }
  if (a.qty < b.qty) {
    return 1;
  }
  return 0;
}

function loadSoldProducts() {
  sold.sort(discend);

  let counter = 0;
  let sold_list = "";
  let items = 0;
  $("#product_sales").empty();

  sold.forEach((item, index) => {
    items += item.qty;

    let product = allProducts.filter(function(selected) {
      return selected._id == item.id;
    });

    sold_list += `<tr>
            <td>${item.product}</td>
            <td>${item.qty}</td>
            <td>${product.length > 0 ? product[0].stock && product[0].quantity : 0}</td>
            <td>${settings.symbol + formatPrice(item.qty * parseInt(item.price))}</td>
            </tr>`;
  });

  $("#total_items #counter").text(items);
  $("#total_products #counter").text(sold.length);
  $("#product_sales").html(sold_list);
}

function userFilter(users) {
  $("#users").empty();
  $("#users").append(`<option value="0">All</option>`);

  users.forEach((user) => {
    let u = allUsers.filter(function(usr) {
      return usr._id == user;
    });

    if (u.length) {
      $("#users").append(`<option value="${user}">${u[0].fullname}</option>`);
    }
  });
}

function tillFilter(tills) {
  $("#tills").empty();
  $("#tills").append(`<option value="0">All</option>`);
  tills.forEach((till) => {
    $("#tills").append(`<option value="${till}">${till}</option>`);
  });
}

$.fn.viewTransaction = function(index) {
  transaction_index = index;

  let discount = allTransactions[index].discount;
  let customer =
    allTransactions[index].customer == 0
      ? "Khách lạ"
      : allTransactions[index].customer.username;
  let refNumber =
    allTransactions[index].ref_number != ""
      ? allTransactions[index].ref_number
      : allTransactions[index].order;
  let orderNumber = allTransactions[index].order;
  let type = "";
  let tax_row = "";
  let items = "";
  let products = allTransactions[index].items;

  products.forEach((item) => {
    items +=
      "<tr><td>" +
      item.product_name +
      "</td><td>" +
      item.quantity +
      "</td><td>" +
      settings.symbol +
      formatPrice(item.price) +
      "</td></tr>";
  });

  switch (allTransactions[index].payment_type) {
    case 1:
      type = "Tiền mặt";
      break;

    case 2:
      type = "Chuyển khoản";
      break;
  }

  let payment = 0;

  if (allTransactions[index].paid != "") {
    payment = `<tr>
                    <td>Đã trả</td>
                    <td>:</td>
                    <td>${settings.symbol + formatPrice(allTransactions[index].paid)}</td>
                </tr>
                <tr>
                    <td>Thối</td>
                    <td>:</td>
                    <td>${settings.symbol + formatPrice(Math.abs(allTransactions[index].change))}</td>
                </tr>
                <tr>
                    <td>Phương thức TT</td>
                    <td>:</td>
                    <td>${type}</td>
                </tr>`;
  }

  if (settings.charge_tax) {
    tax_row = `<tr>
                <td>Thuế VAT:(${settings.percentage})% </td>
                <td>:</td>
                <td>${settings.symbol}${formatPrice(allTransactions[index].tax)}</td>
            </tr>`;
  }

  receipt = `<div style="font-size: 10px;">                            
        <p style="text-align: center;">
        ${settings.img == "" ? settings.img : '<img style="max-width: 50px;max-width: 100px;" src ="' + img_path + settings.img + '" /><br>'}
            <span style="font-size: 22px;">${settings.store}</span> <br>
            ${settings.address_one} <br>
            ${settings.address_two} <br>
            ${settings.contact != "" ? "SĐT: " + settings.contact + "<br>" : ""} 
            ${settings.tax != "" ? "Mã số thuế: " + settings.tax + "<br>" : ""} 
    </p>
    <hr>
    <left>
        <p>
        Hóa đơn số: ${orderNumber} <br>
        Số tham chiếu: ${refNumber} <br>
        Tên khách hàng: ${allTransactions[index].customer == 0 ? "Khách lạ" : allTransactions[index].customer.name} <br>
        Thu ngân: ${allTransactions[index].user} <br>
        Ngày, giờ: ${moment(allTransactions[index].date).format("DD/MM/YYYY HH:mm:ss")}<br>
        </p>

    </left>
    <hr>
    <table width="100%">
        <thead style="text-align: left;">
        <tr>
            <th>Mặt hàng</th>
            <th>SL</th>
            <th>Giá</th>
        </tr>
        </thead>
        <tbody>
        ${items}                
 
        <tr>                        
            <td><b>Tổng</b></td>
            <td>:</td>
            <td><b>${settings.symbol}${formatPrice(allTransactions[index].subtotal)}</b></td>
        </tr>
        <tr>
            <td>Ưu ��ãi</td>
            <td>:</td>
            <td>${discount > 0 ? settings.symbol + formatPrice(allTransactions[index].discount) : ""}</td>
        </tr>
        
        ${tax_row}
    
        <tr>
            <td><h3>Tổng</h3></td>
            <td><h3>:</h3></td>
            <td>
                <h3>${settings.symbol}${formatPrice(allTransactions[index].total)}</h3>
            </td>
        </tr>
        ${payment == 0 ? "" : payment}
        </tbody>
        </table>
        <br>
        <hr>
        <br>
        <p style="text-align: center;">
         ${settings.footer}
         </p>
        </div>`;

  $("#viewTransaction").html("");
  $("#viewTransaction").html(receipt);

  $("#orderModal").modal("show");
};

$("#status").change(function() {
  by_status = $(this).find("option:selected").val();
  loadTransactions();
});

$("#tills").change(function() {
  by_till = $(this).find("option:selected").val();
  loadTransactions();
});

$("#users").change(function() {
  by_user = $(this).find("option:selected").val();
  loadTransactions();
});

$("#reportrange").on("apply.daterangepicker", function(ev, picker) {
  start = picker.startDate.format("DD MMM YYYY hh:mm A");
  end = picker.endDate.format("DD MMM YYYY hh:mm A");

  start_date = picker.startDate.toDate().toJSON();
  end_date = picker.endDate.toDate().toJSON();

  loadTransactions();
});

function authenticate() {
  $("#loading").append(
    `<div id="load"><form id="account"><div class="form-group"><input type="text" placeholder="Tên đăng nhập" name="username" class="form-control"></div>
        <div class="form-group"><input type="password" placeholder="Mật khẩu" name="password" class="form-control"></div>
        <div class="form-group"><input type="submit" id="login-btn" class="btn btn-block btn-default" value="Đăng nhập"></div></form>`,
  );
}

$("body").on("submit", "#account", function(e) {
  e.preventDefault();
  let formData = $(this).serializeObject();

  if (formData.username == "" || formData.password == "") {
    Swal.fire("Không hợp lệ", auth_empty, "warning");
  } else {
    $.ajax({
      url: api + "users/login",
      type: "POST",
      data: JSON.stringify(formData),
      processData: false,
      success: function(data) {
        if (data._id) {
          storage.set("auth", { token: data.token });
          storage.set("user", data);
          ipcRenderer.send("app-reload", "");
        } else {
          Swal.fire("Oops!", auth_error, "warning");
        }
      },
      error: function(data) {
        $("#login-btn").notify(data.responseText, "error");
      },
    });
  }
});

$("#quit").click(function() {
  Swal.fire({
    title: "Chắc chưa",
    text: "Bạn chuẩn bị đóng ứng dụng",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Đóng ứng dụng",
    cancelButtonText: "Hủy",
  }).then((result) => {
    if (result.value) {
      ipcRenderer.send("app-quit", "");
    }
  });
});
