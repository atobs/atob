
function handle_imgur_upload(textareaEl, file, cb) {
  // add feedback to indiciate its uploading

  function set_upload_state() {
    textareaEl.attr("disabled", true);

  }

  function end_upload_state() {
    textareaEl.attr("disabled", false);
    setTimeout(() => {
      textareaEl.focus();
      moveCaretToEnd(textareaEl[0]);
      setTimeout(() => {
        moveCaretToEnd(textareaEl[0]);
        textareaEl.focus();
      });
    });
  }

  // from http://stackoverflow.com/questions/4715762/javascript-move-caret-to-last-character
  function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
      el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
      el.focus();
      var range = el.createTextRange();
      range.collapse(false);
      range.select();
    }
  }


  function set_textarea_val(stub) {
    var val = textareaEl.val();
    textareaEl.val('').focus().val(val + stub);
  }

  function stub_imgur_request() {
    setTimeout(() => {
      var link = "/images/atobi.png";

      var textareaval = " ![" + file.name + "](" + link + ") ";

      set_textarea_val(textareaval);
      end_upload_state();

      if (cb) {
        cb();
      }

    }, 1000);
  }

  function real_imgur_request() {
    /* Lets build a FormData object*/
    var fd = new FormData(); // I wrote about it: https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
    fd.append("image", file); // Append the file
    var xhr = new XMLHttpRequest(); // Create the XHR (Cross-Domain XHR FTW!!!) Thank you sooooo much imgur.com
    xhr.open("POST", "https://api.imgur.com/3/image.json"); // Boooom!
    xhr.onload = () => {
      var response = JSON.parse(xhr.responseText);
      var link = response.data.link;

      var textareaval = " ![" + file.name + "](" + link + ") ";
      set_textarea_val(textareaval);
      end_upload_state();

      if (cb) {
        cb();
      }
    };
    xhr.setRequestHeader('Authorization', "Client-ID " + IMGUR_KEY); // Get your own key http://api.imgur.com/
    xhr.send(fd);
  }

  set_upload_state();
  real_imgur_request();
//  stub_imgur_request();


}

module.exports = handle_imgur_upload;
