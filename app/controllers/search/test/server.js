describe("A blank test for search", () => {
  it("should work", done => {
    SF.controller("search", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
