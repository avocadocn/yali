'use strict';

/* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

describe('e2e', function() {

  beforeEach(function() {
    browser().navigateTo('/users/signin');
  });

  // it('should have a working / page', function() {
  //   console.log(browser().location().path().value==undefined);
  //   console.log(browser().location());
  //   expect(browser().location().path()).toBe(undefined);
  //   // expect(element('btn_reg a').html()).toContain('data-app-youtube-listings');
  // });

  it('should jump to /users/signin', function() {
    // browser().navigateTo('/user/signin');
    console.log(browser().location());
    console.log(browser().window());
    expect(browser().location().hash()).toBe(undefined);
    expect(browser().location().path()).toBe('/users/signin');
  });

});