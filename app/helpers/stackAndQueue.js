'use strict';


exports.stack = function(){
  this.st = [];
  this.top = -1;
  this.push = function(j){
    this.top++;
    this.st.push(j);
  }
  this.pop = function(){
    this.top--;
    return this.st.pop();
  }
  this.peek = function(){
    return this.st[this.top];
  }
  this.isEmpty = function(){
    return this.top === -1;
  }
}


exports.queue = function(){
  this.que = [];
  this.front = -1;
  this.queue = -1;
}