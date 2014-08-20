'use strict';

(function($) {

  var loading_modal = $('#loading_modal');
  var failed_modal = $('#failed_modal');
  var failed_msg = $('#failed_msg');
  var photo_input = $('#photo');

  $('.js_ajax_form').ajaxForm(function(data, status) {
    if (status === 'success') {
      if (data.result === 1) {
        window.location.reload();
      } else {
        failed_msg.text(data.msg);
        loading_modal.modal('hide');
        failed_modal.modal();
      }

    }
  });
  photo_input.change(function() {

    if ($(this).val() !== '' || $(this).val() != null) {

      var can_upload = true;
      var total_size = 0;
      for (var i = 0, files = photo_input[0].files; i < files.length; i++) {
        if (files[i].type.indexOf('image') === -1) {
          failed_msg.text('请选择图片文件');
          failed_modal.modal();
          can_upload = false;
          break;
        }
        total_size += files[i].size;
      }
      if (total_size >= 1024 * 1024 * 5) {
        can_upload = false;
        failed_msg.text('抱歉，一次上传的文件的总大小不可以超过5MB。');
        failed_modal.modal();
      }
      if (can_upload == true) {
        $('#upload_photo_form').submit();
        loading_modal.modal();
      }
    }
  });
  var deleteForm = $('#delete_form');
  deleteForm.ajaxForm(function(data, status) {
    window.location.href = $('#return_uri').val();
  });
  $('#delete_button').click(function() {
    alertify.set({
      buttonFocus: "none",
      labels: {
        ok: '确认删除',
        cancel: '取消'
      }
    });
    alertify.confirm('删除后不可恢复，您确定要删除该相册吗？', function(e) {
      if (e) {
        deleteForm.submit();
      } else {

      }
    });
  });

}(jQuery));