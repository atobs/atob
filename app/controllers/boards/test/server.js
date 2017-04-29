describe("A blank test for boards", () => {
  it("should work", done => {
    SF.controller("boards", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
