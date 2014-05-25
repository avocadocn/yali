'use strict';

(function($, FileHelper) {
  $(function() {

    var photo = $('#photo');
    var jcrop_img = $('#jcrop_img');
    var preview_big = $('#preview_big');
    var preview_middle = $('#preview_middle');
    var preview_small = $('#preview_small');
    var save_button = $('#save_button');
    var remind = $('#remind');

    photo.change(function() {
      if (photo.val() === null) {
        save_button[0].disabled = true;
      } else {
        if (photo[0].files[0].size > 1024 * 1024 * 5) {
          save_button[0].disabled = true;
          remind.text('上传的文件大小不可以超过5M');
        } else {
          save_button[0].disabled = false;
        }
      }

      FileHelper.getFilePath(photo[0], function(path) {

        jcrop_img.attr('src', path);
        preview_big.attr('src', path);
        preview_middle.attr('src', path);
        preview_small.attr('src', path);

        jcrop_img.Jcrop({
          setSelect: [0, 0, 128, 128],
          aspectRatio: 1,
          onSelect: showPreview,
          onChange: showPreview
        });

        $('.jcrop-holder img').attr('src', path);

      });

    });

    function showPreview(coords)
    {
      var imgx = jcrop_img.width();
      var imgy = jcrop_img.height();

      // 裁剪参数，单位为百分比
      $('#w').val(coords.w / imgx);
      $('#h').val(coords.h / imgy);
      $('#x').val(coords.x / imgx);
      $('#y').val(coords.y / imgy);

      var thumbnails = [preview_big, preview_middle, preview_small];
      var sizes = [150, 50, 27]; // size.x = size.y

      for(var i = 0; i < thumbnails.length; i++) {

        var rx = sizes[i] / coords.w;
        var ry = sizes[i] / coords.h;
        thumbnails[i].css({
          width: Math.round(rx * imgx) + 'px',
          height: Math.round(ry * imgy) + 'px',
          marginLeft: '-' + Math.round(rx * coords.x) + 'px',
          marginTop: '-' + Math.round(ry * coords.y) + 'px'
        });
      }

    }


  });

}(jQuery, FileHelper));