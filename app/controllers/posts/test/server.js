describe("A blank test for posts", () => {
  it("should work", done => {
    SF.controller("posts", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
