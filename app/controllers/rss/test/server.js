describe("A blank test for rss", () => {
  it("should work", done => {
    SF.controller("rss", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
