'use strict';

(function($) {
  $(function() {

    var logo = $('#logo');
    var preview_big = $('#preview_big');
    var preview_middle = $('#preview_middle');
    var preview_small = $('#preview_small');
    var save_button = $('#save_button');
    var remind = $('#remind');
    var return_uri = $('#return_uri').val();

    var jcrop_container = $('#jcrop_container');
    var clone_img = jcrop_container.find('img').clone();

    var getFilePath = function(input, callback) {
      var file = input.files[0];
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function(e) {
        callback(this.result);
      };
    };

    logo.change(function() {
      if (logo.val() === null || logo.val() === '') {
        save_button[0].disabled = true;
      } else {
        if (logo[0].files[0].type.indexOf('image') === -1) {
          save_button[0].disabled = true;
          remind.text('请选择图片文件');
          return;
        } else if (logo[0].files[0].size > 1024 * 1024 * 5) {
          save_button[0].disabled = true;
          remind.text('上传的文件大小不可以超过5M');
          return;
        } else {
          save_button[0].disabled = false;
        }
      }

      getFilePath(logo[0], function(path) {

        jcrop_container.html(clone_img.clone());
        var jcrop_img = jcrop_container.find('img');

        var showPreview = function(coords) {
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
        };

        jcrop_img.attr('src', path);
        preview_big.attr('src', path);
        preview_middle.attr('src', path);
        preview_small.attr('src', path);

        var width = jcrop_img.width();
        var height = jcrop_img.height();

        preview_big.width(width).height(height);
        preview_middle.width(width).height(height);
        preview_small.width(width).height(height);

        jcrop_img.Jcrop({
          setSelect: [0, 0, 128, 128],
          aspectRatio: 1,
          onSelect: showPreview,
          onChange: showPreview
        });

        $('.jcrop-holder img').attr('src', path);

      });

    });

    $('#edit_logo_form').ajaxForm(function(data, status) {
      if (status === 'success' && data.result === 1) {
        var body = {
            'border': '1px',
            'border-radius': '0px',
            'top' : '50px',
            'left' : '55%',
            'width' : '350px'
        };

        var buttons = {
            'border-top' : '0px',
            'background' : '#fff',
            'text-align' : 'center'
        }

        var button = {
            'margin-left' : '0px',
            'padding' : '6px 15px',
            'box-shadow' : '0px 0px 0px #ffffff',
            'background-color' : '#3498db'
        }

        $(".alertify-buttons").css(buttons);
        $(".alertify").css(body);
        $(".alertify-button").css(button);
        window.location = return_uri;
      } else {
        $('#loading_modal').modal('hide');
        alertify.alert("修改失败，请重试!");
      }
    });

    $('#edit_logo_form').submit(function() {
      $('#loading_modal').modal();
      $(this).ajaxSubmit();
      return false;
    });


  });

}(jQuery));