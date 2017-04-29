describe("A blank test for profiles", () => {
  it("should work", done => {
    SF.controller("profiles", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
