'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    watch: {
      jade: {
        files: ['src/**/*.jade'],
        tasks: ['jade']
      }
    },
    jade: {
      compile: {
        options: {
          data: {
            debug: false
          }
        },
        files: [{
          expand: true,
          cwd: 'src',
          src: ['**/*.jade', '!index.jade'],
          dest: 'templates/',
          ext: '.html'
        }, {
          src: 'src/index.jade',
          dest: 'index.html'
        }]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jade', 'watch']);

};



