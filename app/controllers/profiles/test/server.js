describe("A blank test for profiles", function() {
  it("should work", function(done) {
    SF.controller("profiles", function(ctrl) {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
