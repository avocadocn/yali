describe("Unit",function(){
  it('should go to /', function(){
    module('donler');
    inject(function ($route) {
      var route = $route.routes['/'];
      expect(route.templateUrl).toBe('/');
    });
  });
});