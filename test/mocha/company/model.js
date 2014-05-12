'use strict';

/**
 * Module dependencies.
 */

var should = require('should'),
    mongoose = require('mongoose'),
    Company = mongoose.model('Company');

//Globals
var company,company2;

//The tests
describe('<Company Unit Test>', function(){
    describe('Model Company:',function(){
        beforeEach(function(done) {
            company = new Company({
                username:'test',
                password:'test'
            });
            company2 = new Company(company);
            done();
        });

        describe('Method Save', function(){
          it('should begin without test Company',function(done){
                Company.find({username: 'test' }, function(err,users){
                    users.should.have.length(0);
                    done();
                });
            });

            it('should be able to save company without problems', function(done){
                company.save(done);
            });

            it('should fail to save an existing Company again', function(done){
                company.save();
                return company2.save(function(err){
                    should.exist(err);
                    done();
                });
            });

            it('should show an error when try to save without username', function(done){
                company2.username='';
                return company2.save(function(err){
                    should.exist(err);
                    done();
                });
            });
        });
        
        afterEach(function(done){
            company.remove();
            done();
        });
    });
});