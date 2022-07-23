const $form = $('#book')
  $form.on('submit', submitHandler)

  function submitHandler(e) {
    e.preventDefault()

    $.ajax({

      url: '/payment',
      method: 'post',
      data: $form.serialize(),
      success: (response) => {
        razorpayPayment(response)
      }
    })
  }
  function razorpayPayment(order) {
    var options = {
      "key": "rzp_test_X8XaIfKmj4XWF0", // Enter the Key ID generated from the Dashboard
      "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      "currency": "INR",
      "name": "Seek The World",
      "description": "Tour Booking",
      "image": "https://example.com/your_logo",
      "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      "handler": function (response) {
        verifyPayment(response, order)
      },
      "prefill": {
        "name": document.getElementById(user).value,
        "email": document.getElementById(email).value,
        "contact": document.getElementById(phone).value
      },
      "notes": {
        "address": document.getElementById(address).value
      },
      "theme": {
        "color": "#3399cc"
      }
    };
    const rzp1 = new Razorpay(options);
    rzp1.open();

  }
  function verifyPayment(payment, order) {
    $.ajax({
      url: '/verifyPayment',
      data: {
        payment,
        order
      },
      method: 'post',
      success: (response) => {
        if (response.status) {
          Swal.fire({
            title: 'Success!',
            text: 'The Booking Has Been Confirmed',
            icon: 'success',
            confirmButtonText: 'Ok',
            timer: 6000
          })
          location.href = '/myBookings'

        }
      }
    })
  }






  function applyCoupon(id) {

    $.ajax({
        type: 'POST',
        url: '/applyCoupon',
        data: { id },
        success: (response) => {
            if (response.used) {
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 6000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })
                Toast.fire({
                    icon: 'error',
                    title: 'Coupon is already used'
                })
                location.reload()
            } else if (response.coupon) {
                location.reload()
            }
        }
    })
}

    
function removeCoupon() {
  $.ajax({
      url: '/removeCoupon',
      method: 'get',
      success: (response) => {
          if (response) {
              location.reload()
          }
      }
  })
}   
