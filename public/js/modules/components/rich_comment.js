'use strict';

angular.module('donler.components.richComment', ['angularFileUpload'])
  
  .filter("unsafe", ['$sce', function($sce) {
    return function(val) {
      return $sce.trustAsHtml(val);
    };
  }])

  .filter("emoji", function () {
    var emojis = [
      "bowtie", "smile", "laughing", "blush", "smiley", "relaxed",
      "smirk", "heart_eyes", "kissing_heart", "kissing_closed_eyes", "flushed",
      "relieved", "satisfied", "grin", "wink", "stuck_out_tongue_winking_eye",
      "stuck_out_tongue_closed_eyes", "grinning", "kissing",
      "kissing_smiling_eyes", "stuck_out_tongue", "sleeping", "worried",
      "frowning", "anguished", "open_mouth", "grimacing", "confused", "hushed",
      "expressionless", "unamused", "sweat_smile", "sweat",
      "disappointed_relieved", "weary", "pensive", "disappointed", "confounded",
      "fearful", "cold_sweat", "persevere", "cry", "sob", "joy", "astonished",
      "scream", "neckbeard", "tired_face", "angry", "rage", "triumph", "sleepy",
      "yum", "mask", "sunglasses", "dizzy_face", "imp", "smiling_imp",
      "neutral_face", "no_mouth", "innocent", "alien", "yellow_heart",
      "blue_heart", "purple_heart", "heart", "green_heart", "broken_heart",
      "heartbeat", "heartpulse", "two_hearts", "revolving_hearts", "cupid",
      "sparkling_heart", "sparkles", "star", "star2", "dizzy", "boom",
      "collision", "anger", "exclamation", "question", "grey_exclamation",
      "grey_question", "zzz", "dash", "sweat_drops", "notes", "musical_note",
      "fire", "hankey", "poop", "shit", "\\+1", "thumbsup", "-1", "thumbsdown",
      "ok_hand", "punch", "facepunch", "fist", "v", "wave", "hand", "raised_hand",
      "open_hands", "point_up", "point_down", "point_left", "point_right",
      "raised_hands", "pray", "point_up_2", "clap", "muscle", "metal", "fu",
      "walking", "runner", "running", "couple", "family", "two_men_holding_hands",
      "two_women_holding_hands", "dancer", "dancers", "ok_woman", "no_good",
      "information_desk_person", "raising_hand", "bride_with_veil",
      "person_with_pouting_face", "person_frowning", "bow", "couplekiss",
      "couple_with_heart", "massage", "haircut", "nail_care", "boy", "girl",
      "woman", "man", "baby", "older_woman", "older_man",
      "person_with_blond_hair", "man_with_gua_pi_mao", "man_with_turban",
      "construction_worker", "cop", "angel", "princess", "smiley_cat",
      "smile_cat", "heart_eyes_cat", "kissing_cat", "smirk_cat", "scream_cat",
      "crying_cat_face", "joy_cat", "pouting_cat", "japanese_ogre",
      "japanese_goblin", "see_no_evil", "hear_no_evil", "speak_no_evil",
      "guardsman", "skull", "feet", "lips", "kiss", "droplet", "ear", "eyes",
      "nose", "tongue", "love_letter", "bust_in_silhouette",
      "busts_in_silhouette", "speech_balloon", "thought_balloon", "feelsgood",
      "finnadie", "goberserk", "godmode", "hurtrealbad", "rage1", "rage2",
      "rage3", "rage4", "suspect", "trollface", "sunny", "umbrella", "cloud",
      "snowflake", "snowman", "zap", "cyclone", "foggy", "ocean", "cat", "dog",
      "mouse", "hamster", "rabbit", "wolf", "frog", "tiger", "koala", "bear",
      "pig", "pig_nose", "cow", "boar", "monkey_face", "monkey", "horse",
      "racehorse", "camel", "sheep", "elephant", "panda_face", "snake", "bird",
      "baby_chick", "hatched_chick", "hatching_chick", "chicken", "penguin",
      "turtle", "bug", "honeybee", "ant", "beetle", "snail", "octopus",
      "tropical_fish", "fish", "whale", "whale2", "dolphin", "cow2", "ram", "rat",
      "water_buffalo", "tiger2", "rabbit2", "dragon", "goat", "rooster", "dog2",
      "pig2", "mouse2", "ox", "dragon_face", "blowfish", "crocodile",
      "dromedary_camel", "leopard", "cat2", "poodle", "paw_prints", "bouquet",
      "cherry_blossom", "tulip", "four_leaf_clover", "rose", "sunflower",
      "hibiscus", "maple_leaf", "leaves", "fallen_leaf", "herb", "mushroom",
      "cactus", "palm_tree", "evergreen_tree", "deciduous_tree", "chestnut",
      "seedling", "blossom", "ear_of_rice", "shell", "globe_with_meridians",
      "sun_with_face", "full_moon_with_face", "new_moon_with_face", "new_moon",
      "waxing_crescent_moon", "first_quarter_moon", "waxing_gibbous_moon",
      "full_moon", "waning_gibbous_moon", "last_quarter_moon",
      "waning_crescent_moon", "last_quarter_moon_with_face",
      "first_quarter_moon_with_face", "moon", "earth_africa", "earth_americas",
      "earth_asia", "volcano", "milky_way", "partly_sunny", "octocat", "squirrel",
      "bamboo", "gift_heart", "dolls", "school_satchel", "mortar_board", "flags",
      "fireworks", "sparkler", "wind_chime", "rice_scene", "jack_o_lantern",
      "ghost", "santa", "christmas_tree", "gift", "bell", "no_bell",
      "tanabata_tree", "tada", "confetti_ball", "balloon", "crystal_ball", "cd",
      "dvd", "floppy_disk", "camera", "video_camera", "movie_camera", "computer",
      "tv", "iphone", "phone", "telephone", "telephone_receiver", "pager", "fax",
      "minidisc", "vhs", "sound", "speaker", "mute", "loudspeaker", "mega",
      "hourglass", "hourglass_flowing_sand", "alarm_clock", "watch", "radio",
      "satellite", "loop", "mag", "mag_right", "unlock", "lock",
      "lock_with_ink_pen", "closed_lock_with_key", "key", "bulb", "flashlight",
      "high_brightness", "low_brightness", "electric_plug", "battery", "calling",
      "email", "mailbox", "postbox", "bath", "bathtub", "shower", "toilet",
      "wrench", "nut_and_bolt", "hammer", "seat", "moneybag", "yen", "dollar",
      "pound", "euro", "credit_card", "money_with_wings", "e-mail", "inbox_tray",
      "outbox_tray", "envelope", "incoming_envelope", "postal_horn",
      "mailbox_closed", "mailbox_with_mail", "mailbox_with_no_mail", "door",
      "smoking", "bomb", "gun", "hocho", "pill", "syringe", "page_facing_up",
      "page_with_curl", "bookmark_tabs", "bar_chart", "chart_with_upwards_trend",
      "chart_with_downwards_trend", "scroll", "clipboard", "calendar", "date",
      "card_index", "file_folder", "open_file_folder", "scissors", "pushpin",
      "paperclip", "black_nib", "pencil2", "straight_ruler", "triangular_ruler",
      "closed_book", "green_book", "blue_book", "orange_book", "notebook",
      "notebook_with_decorative_cover", "ledger", "books", "bookmark",
      "name_badge", "microscope", "telescope", "newspaper", "football",
      "basketball", "soccer", "baseball", "tennis", "8ball", "rugby_football",
      "bowling", "golf", "mountain_bicyclist", "bicyclist", "horse_racing",
      "snowboarder", "swimmer", "surfer", "ski", "spades", "hearts", "clubs",
      "diamonds", "gem", "ring", "trophy", "musical_score", "musical_keyboard",
      "violin", "space_invader", "video_game", "black_joker",
      "flower_playing_cards", "game_die", "dart", "mahjong", "clapper", "memo",
      "pencil", "book", "art", "microphone", "headphones", "trumpet", "saxophone",
      "guitar", "shoe", "sandal", "high_heel", "lipstick", "boot", "shirt",
      "tshirt", "necktie", "womans_clothes", "dress", "running_shirt_with_sash",
      "jeans", "kimono", "bikini", "ribbon", "tophat", "crown", "womans_hat",
      "mans_shoe", "closed_umbrella", "briefcase", "handbag", "pouch", "purse",
      "eyeglasses", "fishing_pole_and_fish", "coffee", "tea", "sake",
      "baby_bottle", "beer", "beers", "cocktail", "tropical_drink", "wine_glass",
      "fork_and_knife", "pizza", "hamburger", "fries", "poultry_leg",
      "meat_on_bone", "spaghetti", "curry", "fried_shrimp", "bento", "sushi",
      "fish_cake", "rice_ball", "rice_cracker", "rice", "ramen", "stew", "oden",
      "dango", "egg", "bread", "doughnut", "custard", "icecream", "ice_cream",
      "shaved_ice", "birthday", "cake", "cookie", "chocolate_bar", "candy",
      "lollipop", "honey_pot", "apple", "green_apple", "tangerine", "lemon",
      "cherries", "grapes", "watermelon", "strawberry", "peach", "melon",
      "banana", "pear", "pineapple", "sweet_potato", "eggplant", "tomato", "corn",
      "house", "house_with_garden", "school", "office", "post_office", "hospital",
      "bank", "convenience_store", "love_hotel", "hotel", "wedding", "church",
      "department_store", "european_post_office", "city_sunrise", "city_sunset",
      "japanese_castle", "european_castle", "tent", "factory", "tokyo_tower",
      "japan", "mount_fuji", "sunrise_over_mountains", "sunrise", "stars",
      "statue_of_liberty", "bridge_at_night", "carousel_horse", "rainbow",
      "ferris_wheel", "fountain", "roller_coaster", "ship", "speedboat", "boat",
      "sailboat", "rowboat", "anchor", "rocket", "airplane", "helicopter",
      "steam_locomotive", "tram", "mountain_railway", "bike", "aerial_tramway",
      "suspension_railway", "mountain_cableway", "tractor", "blue_car",
      "oncoming_automobile", "car", "red_car", "taxi", "oncoming_taxi",
      "articulated_lorry", "bus", "oncoming_bus", "rotating_light", "police_car",
      "oncoming_police_car", "fire_engine", "ambulance", "minibus", "truck",
      "train", "station", "train2", "bullettrain_front", "bullettrain_side",
      "light_rail", "monorail", "railway_car", "trolleybus", "ticket", "fuelpump",
      "vertical_traffic_light", "traffic_light", "warning", "construction",
      "beginner", "atm", "slot_machine", "busstop", "barber", "hotsprings",
      "checkered_flag", "crossed_flags", "izakaya_lantern", "moyai",
      "circus_tent", "performing_arts", "round_pushpin",
      "triangular_flag_on_post", "jp", "kr", "cn", "us", "fr", "es", "it", "ru",
      "gb", "uk", "de", "one", "two", "three", "four", "five", "six", "seven",
      "eight", "nine", "keycap_ten", "1234", "zero", "hash", "symbols",
      "arrow_backward", "arrow_down", "arrow_forward", "arrow_left",
      "capital_abcd", "abcd", "abc", "arrow_lower_left", "arrow_lower_right",
      "arrow_right", "arrow_up", "arrow_upper_left", "arrow_upper_right",
      "arrow_double_down", "arrow_double_up", "arrow_down_small",
      "arrow_heading_down", "arrow_heading_up", "leftwards_arrow_with_hook",
      "arrow_right_hook", "left_right_arrow", "arrow_up_down", "arrow_up_small",
      "arrows_clockwise", "arrows_counterclockwise", "rewind", "fast_forward",
      "information_source", "ok", "twisted_rightwards_arrows", "repeat",
      "repeat_one", "new", "top", "up", "cool", "free", "ng", "cinema", "koko",
      "signal_strength", "u5272", "u5408", "u55b6", "u6307", "u6708", "u6709",
      "u6e80", "u7121", "u7533", "u7a7a", "u7981", "sa", "restroom", "mens",
      "womens", "baby_symbol", "no_smoking", "parking", "wheelchair", "metro",
      "baggage_claim", "accept", "wc", "potable_water", "put_litter_in_its_place",
      "secret", "congratulations", "m", "passport_control", "left_luggage",
      "customs", "ideograph_advantage", "cl", "sos", "id", "no_entry_sign",
      "underage", "no_mobile_phones", "do_not_litter", "non-potable_water",
      "no_bicycles", "no_pedestrians", "children_crossing", "no_entry",
      "eight_spoked_asterisk", "eight_pointed_black_star", "heart_decoration",
      "vs", "vibration_mode", "mobile_phone_off", "chart", "currency_exchange",
      "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpius",
      "sagittarius", "capricorn", "aquarius", "pisces", "ophiuchus",
      "six_pointed_star", "negative_squared_cross_mark", "a", "b", "ab", "o2",
      "diamond_shape_with_a_dot_inside", "recycle", "end", "on", "soon", "clock1",
      "clock130", "clock10", "clock1030", "clock11", "clock1130", "clock12",
      "clock1230", "clock2", "clock230", "clock3", "clock330", "clock4",
      "clock430", "clock5", "clock530", "clock6", "clock630", "clock7",
      "clock730", "clock8", "clock830", "clock9", "clock930", "heavy_dollar_sign",
      "copyright", "registered", "tm", "x", "heavy_exclamation_mark", "bangbang",
      "interrobang", "o", "heavy_multiplication_x", "heavy_plus_sign",
      "heavy_minus_sign", "heavy_division_sign", "white_flower", "100",
      "heavy_check_mark", "ballot_box_with_check", "radio_button", "link",
      "curly_loop", "wavy_dash", "part_alternation_mark", "trident",
      "black_square", "white_square", "white_check_mark", "black_square_button",
      "white_square_button", "black_circle", "white_circle", "red_circle",
      "large_blue_circle", "large_blue_diamond", "large_orange_diamond",
      "small_blue_diamond", "small_orange_diamond", "small_red_triangle",
      "small_red_triangle_down", "shipit"
    ],
    rEmojis = new RegExp(":(" + emojis.join("|") + "):", "g");
    return function (input) {
      return input.replace(rEmojis, function (match, text) {
        return "<i class='emoji emoji_" + text + "' title=':" + text + ":'>" + text + "</i>";
      });
    };
  })

  .controller('RichCommentCtrl', ['$scope', '$http', '$element','$timeout', 'Comment', 'Report', 'FileUploader',
    function ($scope, $http, $element, $timeout, Comment, Report, FileUploader) {
      $scope.pages = [];
      $scope.nowPage = 0;
      $scope.showMoreComment = false;

      var CommentBox = function (args) {

        Object.defineProperty(this, 'photo_album_id', {
          set: function (value) {
            this.uploader.url = '/photoAlbum/' + value + '/photo/single';
          }
        });

        if (args) {
          this.host_type = args.host_type;
          this.host_id = args.host_id;
          this.photo_album_id = args.photo_album_id;
        }

        var uploader = new FileUploader({
          url: this.photo_album_id ? '/photoAlbum/' + this.photo_album_id + '/photo/single' : null
        });

        uploader.filters.push({
          name: 'imageFilter',
          fn: function(item, options) {
            var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
          }
        });
        uploader.onAfterAddingAll = function(){
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
        };
        this.uploader = uploader;
      };

      CommentBox.prototype.publish = function (content, callback) {
        if (!content && content === '') return;
        var self = this;
        if (self.uploader.getNotUploadedItems().length > 0) {
          if (!this.uploader.url || this.uploader.url === '') return;
          self.uploader.uploadAll();
          self.uploader.onSuccessItem = function (item, data, status, headers) {
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          };
          self.uploader.onCompleteAll = function () {
            Comment.publish({
              host_id: self.host_id,
              host_type: self.host_type,
              content: content
            }, function (err, comment) {
              self.uploader.clearQueue();
              callback(err, comment);
            });
          };
        } else {
          Comment.publish({
            host_id: self.host_id,
            host_type: self.host_type,
            content: content
          }, function (err, comment) {
            self.uploader.clearQueue();
            callback(err, comment);
          });
        }

      };

      var cbox = new CommentBox();
      $scope.uploader = cbox.uploader;


      $scope.publish = function (content, form) {
        cbox.publish(content, function (err, comment) {
          if (err) {
            console.log(err);
          } else {
            $scope.comments.unshift({
              '_id':comment._id,
              'host_id' : comment.host_id,
              'content' : comment.content,
              'create_date' : comment.create_date,
              'poster' : comment.poster,
              'photos': comment.photos,
              'host_type' : comment.host_type,
              'delete_permission':true
            });
            $scope.new_comment.text = '';
            form.$setPristine();
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          }

        });
      };
      if($scope.componentId){
        $http.get('/components/RichComment/id/' + $scope.componentId)
        .success(function (data) {
          if (data.result === 1) {
            cbox.host_type = data.componentData.hostType;
            cbox.host_id = data.componentData.hostId;
            cbox.photo_album_id = data.componentData.photoAlbumId;
            $scope.photoAlbumId = data.componentData.photoAlbumId;
            $scope.userPhoto = data.componentData.userPhoto;
            $scope.gotComponentData = true;
            Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
              if (err) {
                alertify.alert('获取评论失败，请刷新页面重试');
              } else {
                $scope.comments = comments;
                if (!$scope.pages[$scope.nowPage]) {
                  var page = {
                    nextStartDate: nextStartDate
                  };
                  if ($scope.comments[0]) {
                    page.thisStartDate = $scope.comments[0].create_date;
                  }
                  $scope.pages.push(page);
                }
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        })
        .error(function (data, status) {
          alertify.alert('获取评论失败，请刷新页面重试');
        });
      }


      $scope.new_comment = {
        text: ''
      };


      var getReplies = function (comment) {
        Comment.getReplies(comment._id, function (err, replies) {
          comment.replies = replies;
          comment.reply_count = replies.length;
        });
      };


      $scope.last_reply_comment;
      $scope.toggleComment = function (comment) {
        if ($scope.last_reply_comment && $scope.last_reply_comment != comment) {
          $scope.last_reply_comment.replying = false;
        }
        comment.replying = !comment.replying;
        $scope.last_reply_comment = comment;
        if (comment.replying) {
          getReplies(comment);
          $scope.now_reply_to = {
            _id: comment.poster._id,
            nickname: comment.poster.nickname
          };
          if($scope.afterRender){
            $timeout(function () {
              $scope.afterRender();
            });
          }
        }
      };

      $scope.setReplyTo = function (comment, to, nickname) {
        if ($scope.last_reply_comment != comment) {
          $scope.last_reply_comment.replying = false;
          $scope.last_reply_comment = comment;
        }
        if (!comment.replying) {
          comment.replying = true;
        }
        $scope.now_reply_to = {
          _id: to,
          nickname: nickname
        };
      };
      $scope.reply = function (comment, form) {
        if (!comment.new_reply || comment.new_reply === '') return;
        Comment.reply(comment._id, $scope.now_reply_to._id, comment.new_reply, function (err, reply) {
          if (err) {
            // TO DO
          } else {
            if (!comment.replies) {
              comment.replies = [];
            }
            comment.replies.push(reply);
            comment.reply_count++;
            comment.new_reply = "";
            form.$setPristine();
            if($scope.afterRender){
              $timeout(function () {
                $scope.afterRender();
              });
            }
          }
        });
      };


      $scope.deleteComment = function (index) {
        alertify.confirm('确认要删除该评论吗？',function (e) {
          if(e){
            try {
              Comment.remove($scope.comments[index]._id, function (err) {
                if (err) {
                  alertify.alert('删除失败，请重试。');
                } else {
                  $scope.comments.splice(index,1);
                  if($scope.afterRender){
                    $timeout(function () {
                      $scope.afterRender();
                    });
                  }
                }
              });
            }
            catch(e) {
              console.log(e);
            }
          }
        });
      };

      $scope.removeReply = function (comment, index) {
        alertify.confirm('确认要删除该回复吗？', function (e) {
          if (e) {
            var reply = comment.replies[index];
            Comment.remove(reply._id, function (err) {
              if (err) {
                alertify.alert('删除失败，请重试。');
              } else {
                comment.replies.splice(index, 1);
                comment.reply_count--;
                if($scope.afterRender){
                  $timeout(function () {
                    $scope.afterRender();
                  });
                }
              }
            });
          }
        });
      };

      $scope.nextPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments, nextStartDate) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage++;
            if (!$scope.pages[$scope.nowPage]) {
              var page = {
                thisStartDate: $scope.pages[$scope.nowPage - 1].nextStartDate,
                nextStartDate: nextStartDate
              };
              $scope.pages.push(page);
            }
          }
        }, $scope.pages[$scope.nowPage].nextStartDate);
      };

      $scope.lastPage = function () {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage--;
          }
        }, $scope.pages[$scope.nowPage - 1].thisStartDate);
      };

      $scope.changePage = function (index) {
        Comment.get('campaign', cbox.host_id, function (err, comments) {
          if (err) {
            alertify.alert('获取评论失败，请刷新页面重试');
          } else {
            $scope.comments = comments;
            $scope.nowPage = index;
          }
        }, $scope.pages[index].thisStartDate);
      };

      $scope.showMore = function () {
        $scope.showMoreComment = true;
        if ($scope.afterRender) {
          $timeout(function () {
            $scope.afterRender();
          });
        }
      };

      $scope.originPlaceholder = '输入内容请控制在140字以内';
      $scope.currentPlaceholder = {
        comment: $scope.originPlaceholder,
        reply: $scope.originPlaceholder
      };

    }])

  .directive('simpleComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@',
        commentNum:'@',
        afterRender:'&'
      },
      templateUrl: '/component_templates/simple_comment.html'
    }
  })

  .directive('richComment', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'RichCommentCtrl',
      scope: {
        componentId: '@',
        photoAlbumId: '@',
        allowPublish: '@'
      },
      templateUrl: '/component_templates/rich_comment.html'
    }
  })

  .directive('toggleFocus', function () {
    return {
      restrict: 'A',
      scope: {
        toggleFocus: '='
      },
      link: function (scope, ele, attrs, ctrl) {
        scope.$watch('toggleFocus', function (newVal, oldVal) {
          if (newVal === true) {
            ele.focus();
          }
        });
      }
    };
  });



