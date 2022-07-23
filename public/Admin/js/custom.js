// category start
  function deleteCategory(category) {
    $.ajax({
      url: '/admin/delete-category/' + category,
      method: 'get',
      success: (response) => {
        if (response.status) {
          Toast.fire({
            icon: 'error',
            title: 'Category Deleted'
          })
          $('#category').load(window.location.href + ' #category')
        }
      }
    })
  }
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  })

  

//product add start

  function previewBeforeUpload(id) {
    document.querySelector("#" + id).addEventListener("change", function (e) {
        if (e.target.files.length == 0) {
            return;
        }
        let file = e.target.files[0];
        let url = URL.createObjectURL(file);
        document.querySelector("#" + id + "-preview div").innerText = file.name;
        document.querySelector("#" + id + "-preview img").src = url;
    });
}

previewBeforeUpload("file-1");
previewBeforeUpload("file-2");
previewBeforeUpload("file-3");
previewBeforeUpload("file-4");




//category end


//coupon flatPicker

//block and unblock

function block(blockId){
  swal.fire({
    title:'Are You Sure?',
    text:'Do You Want To block',
    icon:'warning',
    showCancelButton:true,
    buttons:true,
    dangerMode:true,
  }).then((result)=>{
    if(result.isConfirmed){
      $.ajax({
        url:'/admin/block-user/'+blockId,
        method:'get',
        success:(response)=>{
          $('#'+blockId).load(location.href + ' #'+blockId)
        }
      })
    }else{
      swal('something error')
    }
  })
}
function unBlock(unBlockId){
  swal.fire({
    title:'Are You Sure?',
    text:'Do You Want To unblock',
    icon:'warning',
    showCancelButton:true,
    buttons:true,
    dangerMode:true,
  }).then((willDelete)=>{
    if(willDelete.isConfirmed){
      $.ajax({
        url:'/admin/unblock-user/'+unBlockId,
        method:'get',
        success:(response)=>{
          $('#'+unBlockId).load(location.href + ' #'+unBlockId)
        }
      })
    }else{
      swal('something error')
    }
  })
}

//block and unblock user

//deleteCoupon
function deleteCoupon(deleteId){
  swal.fire({
    title:'Are You Sure?',
    text:'Do You Want To Delete',
    icon:'warning',
    buttons:true,
    dangerMode:true,
  }).then((willDelete)=>{
    if(willDelete){
      $.ajax({
        url:'/admin/coupon/delete/'+deleteId,
        method:'get',
        success:(response)=>{
          if(response.status){
            location.reload()
          }
        }
      })
    }else{
      swal('something error')
    }
  })
}