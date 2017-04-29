describe("A blank test", () => {
  it("should work", done => {
    SF.controller("home", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
