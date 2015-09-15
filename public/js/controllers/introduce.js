$(document).ready(function() {
  $('.swiper-container').show();
  $('.loading').fadeOut();
  var swiper = new Swiper('.swiper-container', {
    pagination: '.swiper-pagination',
    nextButton: '.swiper-button-next',
    direction: 'vertical',
    slidesPerView: 1,
    paginationClickable: true,
    spaceBetween: 0,
    autoplay: 3000,
    onInit: function(swiper) {
      swiperAnimateCache(swiper);
      swiperAnimate(swiper);
    },
    onSlideChangeEnd: function(swiper){
      swiperAnimate(swiper); //每个slide切换结束时也运行当前slide动画
      //到了第4页开启自动换页，到了第5页关闭
      if(swiper.activeIndex===3) {
        swiper.startAutoplay();
      }
      else {
        swiper.stopAutoplay();
      }
      if(swiper.activeIndex === 5) {
        $('.swiper-button-next').hide();
      }
      else {
        $('.swiper-button-next').show();
      }
    }
  });
  swiper.stopAutoplay();

});
