describe("A blank test for icons", () => {
  it("should work", done => {
    SF.controller("icons", ctrl => {
      assert.notEqual(ctrl, null);

      done();
    });
  });
});
