'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('e2e', function() {

  beforeEach(function() {
    browser().navigateTo('/');
  });

  it('should have a working / page', function() {
    browser().navigateTo('#/');
    expect(browser().location().path()).toBe("/");
    //expect(element('#ng-view').html()).toContain('data-app-youtube-listings');
  });

  // describe('/users/signin', function() {

  //   beforeEach(function() {
  //     browser.get('/users/signin');
  //   });


  //   it('should render signin when user navigates to /users/signin', function() {
  //     expect(element.all(by.css('btn_reg a')).first().getText()).
  //       toMatch(/企业免费注册/);
  //   });

  // });


  // describe('view2', function() {

  //   beforeEach(function() {
  //     browser.get('index.html#/view2');
  //   });


  //   it('should render view2 when user navigates to /view2', function() {
  //     expect(element.all(by.css('[ng-view] p')).first().getText()).
  //       toMatch(/partial for view 2/);
  //   });

  // });
});