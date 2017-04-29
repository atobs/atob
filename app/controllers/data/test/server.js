describe("A blank test for data", () => {
  it("should work", done => {
    SF.controller("data", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
