module.exports = {
  tagName: "div",
  className: "",
  defaults: {
    content: "default content"
  },
  initialize(options) {
  },
  client(options) {
    function eyeLoop(){
        var randPosX = (Math.floor(Math.random()*100))+120;
        var randPosY = (Math.floor(Math.random()*50))+70;
        var randDelay = (Math.floor(Math.random()*1000));
        $('#eye').delay(randDelay).animate({
            left: randPosX,
            top: randPosY
        }, {
            duration: 1000,
            complete() {
                eyeLoop();
            }
        });
    }
    eyeLoop();
  }
};
