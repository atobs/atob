describe("A blank test for archives", () => {
  it("should work", done => {
    SF.controller("archives", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
